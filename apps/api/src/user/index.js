import { HttpError } from "../http.js";
import { handleAuthRoute } from "./auth.js";
import { handleProfileRoute } from "./profile.js";
import { handleProductsRoute } from "./products.js";
import { handleOrdersRoute } from "./orders.js";
import { handleReturnsRoute } from "./returns.js";
import { handleReviewsRoute } from "./reviews.js";
import { handleQuizRoute } from "./quiz.js";
import { handleWishlistRoute } from "./wishlist.js";
import { handleCartRoute } from "./cart.js";

export async function handleUserRoute(req, res, parts, corsHeaders, context) {
  const subRoute = parts[2]; // e.g. "auth", "profile", "addresses", "style-quiz", "wishlist", "orders", "reviews", "returns", "cart", "categories", "vouchers"
  const action = parts[3];   // e.g. "signup", "signin", or order ID, etc.

  switch (subRoute) {
    case "auth":
      return await handleAuthRoute(req, res, action, corsHeaders, context);
      
    case "profile":
    case "addresses":
      return await handleProfileRoute(req, res, subRoute, corsHeaders, context);
      
    case "products":
    case "categories":
      return await handleProductsRoute(req, res, subRoute, action, corsHeaders);
      
    case "orders":
    case "vouchers":
      return await handleOrdersRoute(req, res, subRoute, action, parts, corsHeaders, context);
      
    case "returns":
      return await handleReturnsRoute(req, res, action, corsHeaders, context);
      
    case "reviews":
      return await handleReviewsRoute(req, res, corsHeaders, context);
      
    case "style-quiz":
      return await handleQuizRoute(req, res, corsHeaders, context);
      
    case "wishlist":
      return await handleWishlistRoute(req, res, corsHeaders, context);
      
    case "cart":
      return await handleCartRoute(req, res, corsHeaders, context);
      
    default:
      throw new HttpError(404, "NOT_FOUND", "API endpoint not found");
  }
}
export { requireUserAuth } from "./auth.js";
