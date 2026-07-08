import { HttpError, readJson, sendJson } from "../http.js";
import { selectOne, selectRows, updateRows } from "../supabase.js";
import { requireUserAuth } from "./auth.js";

export async function handleWishlistRoute(req, res, corsHeaders, context) {
  const profile = requireUserAuth(context);

  // GET /api/user/wishlist
  if (req.method === "GET") {
    const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
    const wishlist = user.wishlist || [];
    if (!wishlist.length) {
      return sendJson(res, 200, { success: true, items: [] }, corsHeaders);
    }

    // Filter UUIDs to avoid SQL query format exceptions
    const uuids = wishlist.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
    if (!uuids.length) {
      return sendJson(res, 200, { success: true, items: [] }, corsHeaders);
    }

    const products = await selectRows("product", { product_id: `in.(${uuids.join(",")})` });
    return sendJson(res, 200, { success: true, items: products.rows }, corsHeaders);
  }

  // POST /api/user/wishlist
  if (req.method === "POST") {
    const body = await readJson(req);
    const { product_id } = body;
    if (!product_id) {
      throw new HttpError(400, "BAD_REQUEST", "product_id là bắt buộc");
    }

    const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
    let wishlist = user.wishlist || [];
    if (!wishlist.includes(product_id)) {
      wishlist = [...wishlist, product_id];
      await updateRows("users", { user_id: `eq.${profile.user_id}` }, { wishlist });
    }

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

    const user = await selectOne("users", { user_id: `eq.${profile.user_id}` });
    let wishlist = user.wishlist || [];
    if (wishlist.includes(product_id)) {
      wishlist = wishlist.filter(id => id !== product_id);
      await updateRows("users", { user_id: `eq.${profile.user_id}` }, { wishlist });
    }

    return sendJson(res, 200, { success: true, wishlist }, corsHeaders);
  }

  throw new HttpError(404, "NOT_FOUND", "Route wishlist not found");
}
