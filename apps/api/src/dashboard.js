import { selectRows } from "./supabase.js";

function buildDateQuery(fromDate, toDate, dateField = "created_at") {
  const filters = [];
  if (fromDate) filters.push(`${dateField}.gte.${fromDate}`);
  if (toDate) filters.push(`${dateField}.lte.${toDate}`);
  if (filters.length > 0) {
    return { and: `(${filters.join(",")})` };
  }
  return {};
}

async function safeSelect(table, query) {
  try {
    return await selectRows(table, query);
  } catch (err) {
    console.error(`[Dashboard] Failed to query "${table}":`, err.message || err);
    return { rows: [], count: 0 };
  }
}

export async function buildDashboardSummary(searchParams) {
  let fromDate = searchParams?.get("from");
  let toDate = searchParams?.get("to");
  const range = searchParams?.get("range") || "week";

  if (!fromDate && !toDate) {
    const now = new Date();
    if (range === "day") {
      const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
      fromDate = start.toISOString();
      toDate = end.toISOString();
    } else if (range === "week") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      fromDate = start.toISOString();
      toDate = now.toISOString();
    } else if (range === "month") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      fromDate = start.toISOString();
      toDate = now.toISOString();
    }
  } else {
    if (fromDate) {
      fromDate = new Date(fromDate).toISOString();
    }
    if (toDate) {
      const d = new Date(toDate);
      d.setHours(23, 59, 59, 999);
      toDate = d.toISOString();
    }
  }

  const dateFilter = buildDateQuery(fromDate, toDate, "created_at");

  const [orders, products, variants, reviews, returns, tickets, promotions, logs, categories, orderItems, users, vouchers] = await Promise.all([
    safeSelect("orders", {
      select: "order_id,total_amount,discount_amount,voucher_id,status,created_at,payments:payment(payment_status,has_discrepancy)",
      limit: 1000,
      order: "created_at.desc",
      ...dateFilter
    }),
    safeSelect("product", {
      select: "product_id,sku,name,category_id,status,updated_at",
      limit: 1000,
      order: "updated_at.desc"
    }),
    safeSelect("variant", {
      select: "variant_id,product_id,stock_quantity,low_stock_threshold,updated_at",
      limit: 1000,
      order: "updated_at.desc"
    }),
    safeSelect("review", {
      select: "review_id,status,rating,submitted_at",
      limit: 1000,
      order: "submitted_at.desc",
      ...buildDateQuery(fromDate, toDate, "submitted_at")
    }),
    safeSelect("return_exchange", {
      select: "return_id,status,created_at",
      limit: 1000,
      order: "created_at.desc"
    }),
    safeSelect("support_ticket", {
      select: "ticket_id,status,priority,created_at",
      limit: 1000,
      order: "created_at.desc"
    }),
    safeSelect("promotion", {
      select: "promo_id,promo_name,is_active,budget_limit,updated_at",
      limit: 1000,
      order: "updated_at.desc"
    }),
    safeSelect("audit_log", {
      select: "audit_id,actor_id,actor_role,target_id,action,module,new_value,timestamp",
      limit: 10,
      order: "timestamp.desc"
    }),
    safeSelect("category", {
      select: "category_id,name",
      limit: 100
    }),
    safeSelect("order_item", {
      select: "variant_id,quantity,subtotal_item,applied_promo_id",
      limit: 10000
    }),
    safeSelect("users", {
      select: "user_id,full_name,email",
      limit: 1000
    }),
    safeSelect("voucher", {
      select: "voucher_id,code,name",
      limit: 1000
    })
  ]);

  const orderRows = orders.rows;
  const productRows = products.rows;
  const variantRows = variants.rows;
  const reviewRows = reviews.rows;
  const returnRows = returns.rows;
  const ticketRows = tickets.rows;
  const promotionRows = promotions.rows;
  const logRowsRaw = logs.rows || [];
  const categoryRows = categories.rows || [];
  const orderItemRows = orderItems.rows || [];
  const userRows = users.rows || [];
  const voucherRows = vouchers.rows || [];

  const paymentErrors = orderRows.filter((row) => {
    const p = Array.isArray(row.payments) ? row.payments[0] : row.payments;
    return p?.payment_status === "failed" || p?.payment_status === "discrepancy" || p?.has_discrepancy === true;
  }).length;

  const validOrders = orderRows.filter((row) => !["cancelled", "returned"].includes(row.status));
  const revenue = validOrders.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const averageOrderValue = validOrders.length > 0 ? Math.round(revenue / validOrders.length) : 0;
  const completionRate = orderRows.length > 0
    ? Math.round((1 - paymentErrors / orderRows.length) * 100)
    : 100;

  // Resolve actor names for audit logs
  const logRows = logRowsRaw.map((log) => {
    const actorUser = userRows.find((u) => u.user_id === log.actor_id);
    return {
      ...log,
      actor_name: actorUser ? actorUser.full_name : (log.actor_id || "Hệ thống")
    };
  });

  // Map variant_id to product details
  const variantToProduct = {};
  variantRows.forEach((v) => {
    const p = productRows.find((prod) => prod.product_id === v.product_id);
    if (p) {
      variantToProduct[v.variant_id] = p;
    }
  });

  // Calculate Best Selling Products
  const productSales = {};
  orderItemRows.forEach((item) => {
    const prod = variantToProduct[item.variant_id];
    if (prod) {
      if (!productSales[prod.product_id]) {
        productSales[prod.product_id] = {
          product_id: prod.product_id,
          sku: prod.sku,
          name: prod.name,
          category_id: prod.category_id,
          qty: 0,
          revenue: 0
        };
      }
      productSales[prod.product_id].qty += Number(item.quantity || 0);
      productSales[prod.product_id].revenue += Number(item.subtotal_item || 0);
    }
  });

  const bestSellers = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)
    .map((item) => {
      const prodVariants = variantRows.filter((v) => v.product_id === item.product_id);
      const totalStock = prodVariants.reduce((sum, v) => sum + Number(v.stock_quantity || 0), 0);
      const lowStockThresh = prodVariants.reduce((sum, v) => sum + Number(v.low_stock_threshold || 5), 0) / (prodVariants.length || 1);
      
      let stockStatus = "Còn hàng";
      let statusClass = "success";
      if (totalStock <= 0) {
        stockStatus = "Hết hàng";
        statusClass = "danger";
      } else if (totalStock <= lowStockThresh) {
        stockStatus = "Sắp hết";
        statusClass = "warning";
      }

      return {
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        qty: item.qty,
        revenue: item.revenue,
        stockStatus,
        statusClass
      };
    });

  // Calculate Category Contributions
  const categorySales = {};
  categoryRows.forEach((cat) => {
    categorySales[cat.category_id] = {
      name: cat.name,
      revenue: 0
    };
  });

  orderItemRows.forEach((item) => {
    const prod = variantToProduct[item.variant_id];
    if (prod && categorySales[prod.category_id]) {
      categorySales[prod.category_id].revenue += Number(item.subtotal_item || 0);
    }
  });

  const totalCategoryRevenue = Object.values(categorySales).reduce((sum, cat) => sum + cat.revenue, 0);

  const categoryContributions = Object.values(categorySales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)
    .map((cat) => {
      const pct = totalCategoryRevenue > 0 ? Math.round((cat.revenue * 100) / totalCategoryRevenue) : 0;
      return {
        name: cat.name,
        revenue: cat.revenue,
        pct
      };
    });

  // Calculate promo stats
  const promoOrdersCount = orderRows.filter(r => r.voucher_id || Number(r.discount_amount) > 0).length;
  const totalDiscount = orderRows.reduce((sum, r) => sum + Number(r.discount_amount || 0), 0);

  const voucherCounts = {};
  orderRows.forEach(r => {
    if (r.voucher_id) {
      voucherCounts[r.voucher_id] = (voucherCounts[r.voucher_id] || 0) + 1;
    }
  });
  let mostUsedVoucher = "Không có";
  let maxVoucherCount = 0;
  Object.entries(voucherCounts).forEach(([vId, count]) => {
    if (count > maxVoucherCount) {
      maxVoucherCount = count;
      const v = voucherRows.find(voc => voc.voucher_id === vId);
      if (v) mostUsedVoucher = v.code;
    }
  });

  const promoSales = {};
  orderItemRows.forEach(item => {
    if (item.applied_promo_id) {
      promoSales[item.applied_promo_id] = (promoSales[item.applied_promo_id] || 0) + Number(item.subtotal_item || 0);
    }
  });
  let bestCampaign = "Không có";
  let maxPromoSales = 0;
  Object.entries(promoSales).forEach(([pId, sales]) => {
    if (sales > maxPromoSales) {
      maxPromoSales = sales;
      const p = promotionRows.find(pr => pr.promo_id === pId);
      if (p) bestCampaign = p.promo_name;
    }
  });
  if (bestCampaign === "Không có" && promotionRows.length > 0) {
    const activePromo = promotionRows.find(pr => pr.is_active);
    if (activePromo) bestCampaign = activePromo.promo_name;
  }

  // Calculate daily revenue trend (last 7 days or matching range)
  const dailyPoints = [];
  const startDay = new Date(fromDate);
  const endDay = new Date(toDate);
  
  // Calculate duration in days
  const diffTime = Math.abs(endDay - startDay);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 7;
  
  // Create points
  for (let i = 0; i < Math.min(diffDays, 15); i++) {
    const d = new Date(startDay.getTime() + i * 24 * 60 * 60 * 1000);
    const dayStr = d.toISOString().split("T")[0];
    const formattedDay = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    
    // Sum revenue for this day
    const dayRevenue = orderRows
      .filter((row) => {
        const rowDay = new Date(row.created_at).toISOString().split("T")[0];
        return rowDay === dayStr && !["cancelled", "returned"].includes(row.status);
      })
      .reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
      
    // Count orders for this day
    const dayOrdersCount = orderRows
      .filter((row) => {
        const rowDay = new Date(row.created_at).toISOString().split("T")[0];
        return rowDay === dayStr;
      }).length;
      
    dailyPoints.push({
      dateStr: formattedDay,
      revenue: dayRevenue,
      orderCount: dayOrdersCount
    });
  }

  return {
    range,
    from: fromDate,
    to: toDate,
    operations: {
      pendingOrders: orderRows.filter((row) => row.status === "pending").length,
      paymentErrors,
      lowStockProducts: variantRows.filter((row) => Number(row.stock_quantity) <= Number(row.low_stock_threshold || 0)).length,
      urgentReviews: reviewRows.filter((row) => Number(row.rating) <= 2).length,
      openReturns: returnRows.filter((row) => {
        if (row.status !== "pending") return false;
        const ageInHours = (new Date() - new Date(row.created_at)) / (60 * 60 * 1000);
        return ageInHours <= 48;
      }).length,
      openSupportTickets: ticketRows.filter((row) => !["resolved", "closed"].includes(row.status)).length
    },
    business: {
      orderCount: orderRows.length,
      revenue,
      averageOrderValue,
      completionRate,
      activeProducts: productRows.filter((row) => row.status === "on_sale").length,
      pendingReviews: reviewRows.filter((row) => row.status === "pending").length,
      promotionBudgetUsed: promotionRows.reduce((sum, sumRow) => sum + Number(sumRow.budget_limit || 0), 0),
      budgetWarnings: 0,
      bestSellers,
      categoryContributions,
      promoOrdersCount,
      totalDiscount,
      mostUsedVoucher,
      bestCampaign,
      revenueTrend: dailyPoints
    },
    recentLogs: logRows
  };
}

