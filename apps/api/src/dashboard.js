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

  const [orders, products, variants, reviews, returns, tickets, promotions] = await Promise.all([
    safeSelect("orders", {
      select: "order_id,total_amount,status,created_at,payments:payment(payment_status,has_discrepancy)",
      limit: 1000,
      order: "created_at.desc",
      ...dateFilter
    }),
    safeSelect("product", {
      select: "product_id,status,updated_at",
      limit: 1000,
      order: "updated_at.desc"
    }),
    safeSelect("variant", {
      select: "variant_id,stock_quantity,low_stock_threshold,updated_at",
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
      order: "created_at.desc",
      ...dateFilter
    }),
    safeSelect("support_ticket", {
      select: "ticket_id,status,priority,created_at",
      limit: 1000,
      order: "created_at.desc",
      ...dateFilter
    }),
    safeSelect("promotion", {
      select: "promo_id,is_active,budget_limit,updated_at",
      limit: 1000,
      order: "updated_at.desc"
    })
  ]);

  const orderRows = orders.rows;
  const productRows = products.rows;
  const variantRows = variants.rows;
  const reviewRows = reviews.rows;
  const returnRows = returns.rows;
  const ticketRows = tickets.rows;
  const promotionRows = promotions.rows;

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

  return {
    range,
    from: fromDate,
    to: toDate,
    operations: {
      pendingOrders: orderRows.filter((row) => row.status === "pending").length,
      paymentErrors,
      lowStockProducts: variantRows.filter((row) => Number(row.stock_quantity) <= Number(row.low_stock_threshold || 0)).length,
      urgentReviews: reviewRows.filter((row) => Number(row.rating) <= 2).length,
      openReturns: returnRows.filter((row) => ["pending", "processing"].includes(row.status)).length,
      openSupportTickets: ticketRows.filter((row) => !["resolved", "closed"].includes(row.status)).length
    },
    business: {
      orderCount: orderRows.length,
      revenue,
      averageOrderValue,
      completionRate,
      activeProducts: productRows.filter((row) => row.status === "on_sale").length,
      pendingReviews: reviewRows.filter((row) => row.status === "pending").length,
      promotionBudgetUsed: promotionRows.reduce((sum, row) => sum + Number(row.budget_limit || 0), 0),
      budgetWarnings: 0
    }
  };
}

