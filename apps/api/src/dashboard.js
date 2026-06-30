import { selectRows } from "./supabase.js";

export async function buildDashboardSummary() {
  const [orders, products, reviews, returns, tickets, budgets] = await Promise.all([
    selectRows("orders", { select: "id,total_amount,status,payment_status,created_at", limit: 200, order: "created_at.desc" }),
    selectRows("products", { select: "id,status,stock_quantity,min_stock_quantity", limit: 200, order: "updated_at.desc" }),
    selectRows("reviews", { select: "id,status,rating,alert_level", limit: 200, order: "created_at.desc" }),
    selectRows("return_requests", { select: "id,status,deadline_at", limit: 200, order: "created_at.desc" }),
    selectRows("support_tickets", { select: "id,status,priority", limit: 200, order: "created_at.desc" }),
    selectRows("promotion_budgets", { select: "id,limit_amount,used_amount,status", limit: 100, order: "updated_at.desc" })
  ]);

  const orderRows = orders.rows;
  const productRows = products.rows;
  const reviewRows = reviews.rows;
  const returnRows = returns.rows;
  const ticketRows = tickets.rows;
  const budgetRows = budgets.rows;

  return {
    operations: {
      pendingOrders: orderRows.filter((row) => row.status === "pending").length,
      paymentErrors: orderRows.filter((row) => row.payment_status === "error").length,
      lowStockProducts: productRows.filter((row) => Number(row.stock_quantity) <= Number(row.min_stock_quantity || 0)).length,
      urgentReviews: reviewRows.filter((row) => row.alert_level === "urgent" || Number(row.rating) <= 2).length,
      openReturns: returnRows.filter((row) => ["pending", "processing"].includes(row.status)).length,
      openSupportTickets: ticketRows.filter((row) => !["resolved", "closed"].includes(row.status)).length
    },
    business: {
      orderCount: orderRows.length,
      revenue: orderRows
        .filter((row) => !["cancelled", "returned"].includes(row.status))
        .reduce((sum, row) => sum + Number(row.total_amount || 0), 0),
      activeProducts: productRows.filter((row) => row.status === "active").length,
      pendingReviews: reviewRows.filter((row) => row.status === "pending").length,
      promotionBudgetUsed: budgetRows.reduce((sum, row) => sum + Number(row.used_amount || 0), 0),
      budgetWarnings: budgetRows.filter((row) => row.status === "warning").length
    }
  };
}
