import { HttpError, readJson, sendJson } from "../http.js";
import { selectOne, selectRows, insertRow, updateRows, deleteRows } from "../supabase.js";
import { requireUserAuth } from "./auth.js";

export async function handleReviewsRoute(req, res, corsHeaders, context) {
  const profile = requireUserAuth(context);

  // GET /api/user/reviews
  if (req.method === "GET") {
    const { rows: reviews } = await selectRows("review", { user_id: `eq.${profile.user_id}` });
    return sendJson(res, 200, { success: true, reviews }, corsHeaders);
  }

  // POST /api/user/reviews
  if (req.method === "POST") {
    const body = await readJson(req);
    const { product_id, order_id, rating, comment, images, review_tags } = body;

    if (!product_id || !order_id || !rating) {
      throw new HttpError(400, "BAD_REQUEST", "Thiếu thông tin product_id, order_id hoặc rating");
    }

    // Check if order belongs to user
    const order = await selectOne("orders", { order_id: `eq.${order_id}` });
    if (!order || order.user_id !== profile.user_id) {
      throw new HttpError(403, "FORBIDDEN", "Đơn hàng không hợp lệ");
    }

    if (order.status !== "delivered" && order.status !== "completed") {
      throw new HttpError(400, "BAD_REQUEST", "Chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã giao thành công hoặc hoàn thành");
    }

    // Check if review already exists for this product in this order
    const existingReview = await selectOne("review", {
      product_id: `eq.${product_id}`,
      order_id: `eq.${order_id}`,
      user_id: `eq.${profile.user_id}`
    });

    if (existingReview) {
      if (existingReview.status === "rejected") {
        // Delete old rejected review to allow re-review
        await deleteRows("review", { review_id: `eq.${existingReview.review_id}` });
      } else {
        throw new HttpError(400, "BAD_REQUEST", "Sản phẩm này trong đơn hàng đã được đánh giá rồi");
      }
    }

    // 1. Save initially as 'pending'
    const review = await insertRow("review", {
      product_id,
      user_id: profile.user_id,
      order_id,
      rating,
      comment: comment || null,
      images: images || null,
      review_tags: review_tags || null,
      status: "pending",
      submitted_at: new Date().toISOString()
    });

    console.log(`[AUTO-MODERATION Queue] Đã đưa đánh giá ${review.review_id} vào hàng đợi kiểm duyệt tự động.`);

    // 2. Perform auto-moderation
    const profanities = ["đéo", "chửi", "vãi", "cứt", "mẹ kiếp", "đầu buồi", "dcm", "clm", "địt", "lồn", "buồi", "cặc", "ngu", "chó", "khốn nạn"];
    const adKeywords = ["http://", "https://", "t.me/", "zalo:", "shopee.vn", "lazada.vn", "click vào đây", "nhận quà miễn phí", "quà tặng miễn phí", "mua ngay", "giảm giá sốc"];

    let finalStatus = "approved";
    let rejectionReason = null;
    const lowerComment = (comment || "").toLowerCase();

    // Check profanities
    for (const word of profanities) {
      if (lowerComment.includes(word)) {
        finalStatus = "rejected";
        rejectionReason = "Nội dung chứa từ ngữ không phù hợp hoặc thô tục";
        break;
      }
    }

    // Check ads/spam
    if (finalStatus === "approved") {
      for (const ad of adKeywords) {
        if (lowerComment.includes(ad)) {
          finalStatus = "rejected";
          rejectionReason = "Nội dung chứa quảng cáo, spam hoặc liên kết ngoài";
          break;
        }
      }
    }

    // Check image validity
    if (finalStatus === "approved" && Array.isArray(images)) {
      for (const img of images) {
        const lowerImg = img.toLowerCase();
        if (lowerImg.includes("fake") || lowerImg.includes("spam") || lowerImg.includes("cheat") || lowerImg.includes("error")) {
          finalStatus = "rejected";
          rejectionReason = "Hình ảnh tải lên không hợp lệ hoặc chứa nội dung vi phạm";
          break;
        }
      }
    }

    // 3. Update database row with auto-moderation result
    const updatedRows = await updateRows(
      "review",
      { review_id: `eq.${review.review_id}` },
      {
        status: finalStatus,
        rejection_reason: rejectionReason,
        moderated_at: new Date().toISOString()
      }
    );

    const finalReview = updatedRows[0] || review;

    console.log(`[AUTO-MODERATION Result] Đánh giá ${review.review_id} -> Kết quả: ${finalStatus.toUpperCase()}${rejectionReason ? ` (Lý do: ${rejectionReason})` : ""}`);

    return sendJson(res, 200, { success: true, review: finalReview }, corsHeaders);
  }

  throw new HttpError(404, "NOT_FOUND", "Route reviews not found");
}
