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

        // Calculate sold_count dynamically for this single product
        let sold_count = 0;
        try {
          const { rows: activeOrders } = await selectRows("orders", { status: "neq.cancelled" }, { useAnonKey: true });
          const activeOrderIds = new Set(activeOrders.map(o => o.order_id));

          const variantIds = variants.map(v => v.variant_id);
          const { rows: allOrderItems } = await selectRows("order_item", {}, { useAnonKey: true });

          allOrderItems.forEach(item => {
            if (activeOrderIds.has(item.order_id)) {
              const matchesName = item.product_name && product.name && item.product_name.toLowerCase() === product.name.toLowerCase();
              const matchesVariant = variantIds.includes(item.variant_id);
              if (matchesName || matchesVariant) {
                sold_count += Number(item.quantity || 0);
              }
            }
          });
        } catch (err) {
          console.error("Error calculating sold_count for single product:", err);
        }

        return sendJson(res, 200, { ...product, variants, category, reviews, sold_count }, corsHeaders);
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
      
      // Calculate bulk sold counts
      const variantSalesMap = new Map();
      const nameSalesMap = new Map();
      try {
        const { rows: activeOrders } = await selectRows("orders", { status: "neq.cancelled" }, { useAnonKey: true });
        const activeOrderIds = new Set(activeOrders.map(o => o.order_id));

        const { rows: orderItems } = await selectRows("order_item", {}, { useAnonKey: true });
        orderItems.forEach(item => {
          if (activeOrderIds.has(item.order_id)) {
            const qty = Number(item.quantity || 0);
            if (item.variant_id) {
              variantSalesMap.set(item.variant_id, (variantSalesMap.get(item.variant_id) || 0) + qty);
            }
            if (item.product_name) {
              const nameKey = item.product_name.toLowerCase();
              nameSalesMap.set(nameKey, (nameSalesMap.get(nameKey) || 0) + qty);
            }
          }
        });
      } catch (err) {
        console.error("Error calculating bulk sold counts:", err);
      }

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

        // Calculate sold_count based on either matching name or variants
        let sold_count = 0;
        if (p.name) {
          sold_count = nameSalesMap.get(p.name.toLowerCase()) || 0;
        }
        if (sold_count === 0) {
          variants.forEach(v => {
            sold_count += variantSalesMap.get(v.variant_id) || 0;
          });
        }

        const category = categories.find(c => c.category_id === p.category_id);
        return { 
          ...p, 
          variants, 
          category_slug: category ? category.slug : null, 
          category_name: category ? category.name : null,
          sold_count
        };
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
