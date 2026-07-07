import { HttpError, sendJson } from "../http.js";
import { selectOne, selectRows } from "../supabase.js";

export async function handleProductsRoute(req, res, subRoute, action, corsHeaders) {
  if (subRoute === "products") {
    if (req.method === "GET") {
      if (action) {
        const product = await selectOne("product", { product_id: `eq.${action}` }, { useAnonKey: true });
        if (!product) {
          throw new HttpError(404, "NOT_FOUND", "Không tìm thấy sản phẩm");
        }
        let variants = [];
        if (product.is_combo) {
          const { rows: comboItems } = await selectRows("combo_item", { combo_product_id: `eq.${product.product_id}` }, { useAnonKey: true });
          const variantIds = comboItems.map(ci => ci.component_variant_id).filter(Boolean);
          if (variantIds.length > 0) {
            const { rows: compVariants } = await selectRows("variant", { variant_id: `in.(${variantIds.join(",")})` }, { useAnonKey: true });
            variants = compVariants.map(v => ({ ...v, product_id: product.product_id }));
          }
        } else {
          const { rows: dbVariants } = await selectRows("variant", { product_id: `eq.${action}` }, { useAnonKey: true });
          variants = dbVariants;
        }
        const category = product.category_id ? await selectOne("category", { category_id: `eq.${product.category_id}` }, { useAnonKey: true }) : null;
        
        // Fetch approved reviews for this product
        const { rows: dbReviews } = await selectRows("review", {
          product_id: `eq.${action}`,
          status: "eq.approved"
        }, { useAnonKey: true });
        
        let reviews = [];
        if (dbReviews && dbReviews.length > 0) {
          const userIds = [...new Set(dbReviews.map(r => r.user_id))];
          const { rows: reviewUsers } = await selectRows("users", {
            user_id: `in.(${userIds.join(",")})`
          }, { useAnonKey: true });
          const userMap = new Map(reviewUsers.map(u => [u.user_id, u.full_name]));
          reviews = dbReviews.map(r => ({
            ...r,
            user_full_name: userMap.get(r.user_id) || "Khách hàng ẩn danh"
          }));
        }

        return sendJson(res, 200, { ...product, variants, category, reviews }, corsHeaders);
      }

      const { rows: products } = await selectRows("product", { status: "eq.on_sale" }, { useAnonKey: true });
      
      let allVariants = [];
      let variantOffset = 0;
      const variantLimit = 1000;
      while (true) {
        const { rows } = await selectRows("variant", { limit: variantLimit, offset: variantOffset }, { useAnonKey: true });
        if (rows.length === 0) break;
        allVariants = allVariants.concat(rows);
        if (rows.length < variantLimit) break;
        variantOffset += variantLimit;
      }

      const { rows: categories } = await selectRows("category", {}, { useAnonKey: true });
      const { rows: comboItems } = await selectRows("combo_item", {}, { useAnonKey: true });
      
      const productsWithVariants = products.map(p => {
        let variants = [];
        if (p.is_combo) {
          const itemVariantIds = comboItems
            .filter(ci => ci.combo_product_id === p.product_id)
            .map(ci => ci.component_variant_id);
          variants = allVariants
            .filter(v => itemVariantIds.includes(v.variant_id))
            .map(v => ({ ...v, product_id: p.product_id }));
        } else {
          variants = allVariants.filter(v => v.product_id === p.product_id);
        }
        const category = categories.find(c => c.category_id === p.category_id);
        return { ...p, variants, category_slug: category ? category.slug : null, category_name: category ? category.name : null };
      });

      return sendJson(res, 200, productsWithVariants, corsHeaders);
    }
  }

  if (subRoute === "categories") {
    if (req.method === "GET") {
      const { rows: categories } = await selectRows("category", {}, { useAnonKey: true });
      const { rows: products } = await selectRows("product", { status: "eq.on_sale" }, { useAnonKey: true });
      const categoriesWithCount = categories.map(c => {
        const count = products.filter(p => p.category_id === c.category_id).length;
        return { ...c, product_count: count };
      });
      return sendJson(res, 200, categoriesWithCount, corsHeaders);
    }
  }

  throw new HttpError(404, "NOT_FOUND", "Route products or categories not found");
}
