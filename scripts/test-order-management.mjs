/**
 * Test Order Management, Reviews, and Returns
 * Chạy: node --env-file=.env scripts/test-order-management.mjs
 */

import { selectOne, insertRow, selectRows, updateRows, deleteRows } from "../apps/api/src/supabase.js";
import { assertRuntimeConfig } from "../apps/api/src/config.js";

assertRuntimeConfig();

const BASE = "http://localhost:8787";
const TEST_PHONE = "0987654" + Math.floor(100 + Math.random() * 900);
const TEST_EMAIL = `order_test_${Date.now()}@velura.vn`;
const TEST_PASSWORD = "Velura@2025";
const DEV_OTP = "123456";

async function req(path, token, opts = {}) {
  const url = `${BASE}${path}`;
  const method = opts.method || "GET";
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, ok: res.ok, data };
}

function pass(label) { console.log(`  ✅  ${label}`); }
function fail(label, detail) {
  console.error(`  ❌  ${label}`);
  if (detail) console.error("      Chi tiết:", JSON.stringify(detail, null, 2));
}
function section(title) { console.log(`\n━━━  ${title}  ━━━`); }

async function run() {
  section("Preparing Test Data");

  // 1. Get a product variant from DB to associate with orders
  const variant = await selectOne("variant");
  if (!variant) {
    console.error("No variant found in database. Please seed the database first.");
    process.exit(1);
  }
  pass(`Found product variant ID: ${variant.variant_id} (Product ID: ${variant.product_id})`);

  // 2. Sign up and activate a test user
  const signup = await req("/api/user/auth/signup", null, {
    method: "POST",
    body: { full_name: "Order Test User", phone: TEST_PHONE, email: TEST_EMAIL, password: TEST_PASSWORD }
  });
  if (!signup.ok) {
    fail("Signup test user failed", signup.data);
    process.exit(1);
  }

  const verify = await req("/api/user/auth/otp-verify", null, {
    method: "POST",
    body: { identity: TEST_PHONE, otp_code: DEV_OTP }
  });
  if (!verify.ok || !verify.data.token) {
    fail("Activate test user account failed", verify.data);
    process.exit(1);
  }
  const token = verify.data.token;
  const userId = verify.data.user?.user_id || verify.data.profile?.user_id;
  pass(`Created and authenticated test user (ID: ${userId})`);

  // ─────────────────────────────────────────────
  section("Test Case 1: Cancel order when status is 'pending'");
  // ─────────────────────────────────────────────
  {
    // Create a pending order directly in DB
    const order = await insertRow("orders", {
      user_id: userId,
      status: "pending",
      payment_method: "COD",
      subtotal: 150000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 150000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const item = await insertRow("order_item", {
      order_id: order.order_id,
      variant_id: variant.variant_id,
      product_name: "Sản phẩm test",
      quantity: 1,
      unit_price: 150000,
      subtotal_item: 150000
    });

    const { status, ok, data } = await req("/api/user/orders", token, {
      method: "PATCH",
      body: {
        order_id: order.order_id,
        status: "cancelled",
        cancelled_reason: "Khách hàng thay đổi ý định"
      }
    });

    const dbOrder = await selectOne("orders", { order_id: `eq.${order.order_id}` });
    console.log("DB Order after update:", dbOrder);

    if (ok && data.success && data.order.status === "cancelled" && dbOrder.cancelled_reason === "Khách hàng thay đổi ý định") {
      pass("Order cancelled successfully with reason");
    } else {
      fail("Failed to cancel order with reason", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 2: Reject cancellation when status is 'shipping'");
  // ─────────────────────────────────────────────
  {
    const order = await insertRow("orders", {
      user_id: userId,
      status: "shipping",
      payment_method: "COD",
      subtotal: 150000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 150000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const { status, ok, data } = await req("/api/user/orders", token, {
      method: "PATCH",
      body: {
        order_id: order.order_id,
        status: "cancelled",
        cancelled_reason: "Muốn hủy ngang"
      }
    });

    if (status === 400 && data.error && data.error.message && data.error.message.includes("không thể hủy")) {
      pass("Properly rejected cancelling order in 'shipping' state with message: " + data.error.message);
    } else {
      fail("Failed to reject shipping order cancellation", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 3: Create a product review for a 'delivered' order");
  // ─────────────────────────────────────────────
  {
    const order = await insertRow("orders", {
      user_id: userId,
      status: "delivered",
      payment_method: "COD",
      subtotal: 150000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 150000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const item = await insertRow("order_item", {
      order_id: order.order_id,
      variant_id: variant.variant_id,
      product_name: "Sản phẩm test",
      quantity: 1,
      unit_price: 150000,
      subtotal_item: 150000
    });

    const { status, ok, data } = await req("/api/user/reviews", token, {
      method: "POST",
      body: {
        product_id: variant.product_id,
        order_id: order.order_id,
        rating: 5,
        comment: "Sản phẩm chất lượng tuyệt vời!",
        images: [],
        review_tags: ["Đẹp", "Đáng mua"]
      }
    });

    if (ok && data.success && data.review.rating === 5) {
      pass("Review submitted successfully");
    } else {
      fail("Failed to submit review", data);
    }

    // ─────────────────────────────────────────────
    section("Test Case 4: Reject duplicate review for the same product and order");
    // ─────────────────────────────────────────────
    const dupRes = await req("/api/user/reviews", token, {
      method: "POST",
      body: {
        product_id: variant.product_id,
        order_id: order.order_id,
        rating: 4,
        comment: "Đánh giá lần thứ 2 cố ý trùng lặp"
      }
    });

    if (dupRes.status === 400 && dupRes.data.error && dupRes.data.error.message && dupRes.data.error.message.includes("đã được đánh giá rồi")) {
      pass("Properly rejected duplicate review with message: " + dupRes.data.error.message);
    } else {
      fail("Failed to reject duplicate review", dupRes);
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 5: Reject review for a pending/preparing order");
  // ─────────────────────────────────────────────
  {
    const order = await insertRow("orders", {
      user_id: userId,
      status: "pending",
      payment_method: "COD",
      subtotal: 150000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 150000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const { status, ok, data } = await req("/api/user/reviews", token, {
      method: "POST",
      body: {
        product_id: variant.product_id,
        order_id: order.order_id,
        rating: 5,
        comment: "Chưa giao hàng nhưng muốn đánh giá"
      }
    });

    if (status === 400 && data.error && data.error.message && data.error.message.includes("Chỉ có thể đánh giá sản phẩm")) {
      pass("Properly rejected review submission for pending order with message: " + data.error.message);
    } else {
      fail("Failed to reject review for non-delivered order", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 6: Reject review via auto-moderation for profanity");
  // ─────────────────────────────────────────────
  let rejectedOrderId = null;
  {
    const order = await insertRow("orders", {
      user_id: userId,
      status: "delivered",
      payment_method: "COD",
      subtotal: 150000,
      shipping_fee: 0,
      discount_amount: 0,
      total_amount: 150000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    rejectedOrderId = order.order_id;

    await insertRow("order_item", {
      order_id: order.order_id,
      variant_id: variant.variant_id,
      product_name: "Sản phẩm test",
      quantity: 1,
      unit_price: 150000,
      subtotal_item: 150000
    });

    const { status, ok, data } = await req("/api/user/reviews", token, {
      method: "POST",
      body: {
        product_id: variant.product_id,
        order_id: order.order_id,
        rating: 1,
        comment: "Áo này xấu vcl, đéo mặc được đâu, vứt đi!"
      }
    });

    if (ok && data.success && data.review.status === "rejected" && data.review.rejection_reason.includes("thô tục")) {
      pass("Review successfully rejected by auto-moderation with reason: " + data.review.rejection_reason);
    } else {
      fail("Failed to reject profanity review", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 7: Allow re-submitting review after rejection");
  // ─────────────────────────────────────────────
  {
    const { status, ok, data } = await req("/api/user/reviews", token, {
      method: "POST",
      body: {
        product_id: variant.product_id,
        order_id: rejectedOrderId,
        rating: 4,
        comment: "Áo rất đẹp, chất vải thô nhưng mặc khá mát và vừa vặn."
      }
    });

    if (ok && data.success && data.review.status === "approved") {
      pass("Allowed re-submitting review after rejection, new review approved automatically");
    } else {
      fail("Failed to allow re-submission or auto-approve clean review", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 8: Fetch user reviews list");
  // ─────────────────────────────────────────────
  {
    const { status, ok, data } = await req("/api/user/reviews", token);
    if (ok && data.success && Array.isArray(data.reviews)) {
      pass("Fetched reviews list successfully. Reviews count: " + data.reviews.length);
    } else {
      fail("Failed to fetch reviews list", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Test Case 9: Fetch public product details with approved reviews");
  // ─────────────────────────────────────────────
  {
    const { status, ok, data } = await req(`/api/user/products/${variant.product_id}`, null);
    if (ok && data.product_id && Array.isArray(data.reviews)) {
      const hasOurApprovedReview = data.reviews.some(r => r.order_id === rejectedOrderId && r.status === "approved" && r.user_full_name === "Order Test User");
      if (hasOurApprovedReview) {
        pass("Public product detail successfully returned our approved review with reviewer's full name!");
      } else {
        fail("Public product detail returned reviews, but our approved review was not found in the list", data.reviews);
      }
    } else {
      fail("Failed to fetch public product details or reviews field was missing", { status, data });
    }
  }

  // Clean up test data
  section("Cleaning up database test records");
  try {
    const { rows: testOrders } = await selectRows("orders", { user_id: `eq.${userId}` });
    for (const order of testOrders) {
      await deleteRows("review", { order_id: `eq.${order.order_id}` });
      await deleteRows("order_item", { order_id: `eq.${order.order_id}` });
      await deleteRows("orders", { order_id: `eq.${order.order_id}` });
    }
    await deleteRows("users", { user_id: `eq.${userId}` });
    pass("Successfully cleaned up all test records.");
  } catch (e) {
    fail("Cleanup failed", e.message);
  }
}

run().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
