import { HttpError, readJson, sendJson } from "../http.js";
import { selectOne, selectRows, insertRow, deleteRows } from "../supabase.js";
import { requireUserAuth } from "./auth.js";

export async function handleWishlistRoute(req, res, corsHeaders, context) {
  const profile = requireUserAuth(context);

  // GET /api/user/wishlist
  if (req.method === "GET") {
    const result = await selectRows("Wishlists", {
      select: "*,product:product(*)",
      user_id: `eq.${profile.user_id}`
    });

    const products = result.rows.map(item => item.product).filter(Boolean);
    return sendJson(res, 200, { success: true, items: products }, corsHeaders);
  }

  // POST /api/user/wishlist
  if (req.method === "POST") {
    const body = await readJson(req);
    const { product_id } = body;
    if (!product_id) {
      throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
    }

    const existing = await selectOne("Wishlists", {
      user_id: `eq.${profile.user_id}`,
      product_id: `eq.${product_id}`
    });

    if (!existing) {
      await insertRow("Wishlists", {
        user_id: profile.user_id,
        product_id
      });
    }

    const allWishlisted = await selectRows("Wishlists", {
      user_id: `eq.${profile.user_id}`
    });
    const wishlist = allWishlisted.rows.map(item => item.product_id);

    return sendJson(res, 200, { success: true, wishlist }, corsHeaders);
  }

  // DELETE /api/user/wishlist
  if (req.method === "DELETE") {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    let product_id = url.searchParams.get("product_id");
    if (!product_id) {
      const body = await readJson(req).catch(() => ({}));
      product_id = body.product_id;
    }
    if (!product_id) {
      throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
    }

    await deleteRows("Wishlists", {
      user_id: `eq.${profile.user_id}`,
      product_id: `eq.${product_id}`
    });

    const allWishlisted = await selectRows("Wishlists", {
      user_id: `eq.${profile.user_id}`
    });
    const wishlist = allWishlisted.rows.map(item => item.product_id);

    return sendJson(res, 200, { success: true, wishlist }, corsHeaders);
  }

  throw new HttpError(404, "NOT_FOUND", "Route wishlist not found");
}
