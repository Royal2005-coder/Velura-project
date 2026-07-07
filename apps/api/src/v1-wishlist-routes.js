import { HttpError, readJson, sendJson, sendNoContent } from "./http.js";
import { selectRows, selectOne, insertRow, deleteRows } from "./supabase.js";

function requireUserAuth(context) {
  if (!context || !context.profile || !context.profile.user_id) {
    throw new HttpError(401, "UNAUTHORIZED", "Đăng nhập là bắt buộc để thực hiện thao tác này");
  }
  return context.profile;
}

export async function handleWishlistRoute(req, res, parts, corsHeaders, context) {
  const method = req.method;

  try {
    const profile = requireUserAuth(context);

    // GET /api/v1/wishlists
    if (method === "GET") {
      // Query the Wishlists table joining with product table
      const result = await selectRows("Wishlists", {
        select: "*,product:product(*)",
        user_id: `eq.${profile.user_id}`
      });

      // Map Supabase rows to match Frontend / HTML data-bind contract
      const mappedData = result.rows.map(item => {
        const p = item.product || {};
        return {
          id: item.id,
          product: {
            id: p.product_id,
            name: p.name,
            image_url: p.images?.[0] || "",
            price: p.sale_price || p.base_price,
            old_price: (p.sale_price && p.base_price > p.sale_price) ? p.base_price : null,
            badge: p.is_featured ? "HOT" : "NEW"
          },
          added_at: item.created_at
        };
      });

      return sendJson(res, 200, {
        status: "success",
        data: mappedData
      }, corsHeaders);
    }

    // POST /api/v1/wishlists
    if (method === "POST") {
      const body = await readJson(req);
      const { product_id } = body;

      if (!product_id) {
        throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
      }

      // Check if product exists in user's wishlist
      const existing = await selectOne("Wishlists", {
        user_id: `eq.${profile.user_id}`,
        product_id: `eq.${product_id}`
      });

      if (existing) {
        throw new HttpError(409, "CONFLICT", "Sản phẩm đã tồn tại trong danh sách yêu thích");
      }

      // Insert new wishlist item
      const newRow = await insertRow("Wishlists", {
        user_id: profile.user_id,
        product_id
      });

      return sendJson(res, 201, {
        status: "success",
        message: "Đã thêm vào danh sách yêu thích thành công",
        data: newRow
      }, corsHeaders);
    }

    // DELETE /api/v1/wishlists/:product_id
    if (method === "DELETE") {
      const product_id = parts[3];
      if (!product_id) {
        throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc trên URL path");
      }

      await deleteRows("Wishlists", {
        user_id: `eq.${profile.user_id}`,
        product_id: `eq.${product_id}`
      });

      return sendJson(res, 200, {
        status: "success",
        message: "Đã xóa khỏi danh sách yêu thích thành công"
      }, corsHeaders);
    }

    throw new HttpError(405, "METHOD_NOT_ALLOWED", "Phương thức không được hỗ trợ");
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(500, "INTERNAL_SERVER_ERROR", error.message);
  }
}
