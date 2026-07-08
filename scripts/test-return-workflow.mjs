/**
 * Test Return/Exchange Workflow and Exception Handling
 * Run: node --env-file=.env scripts/test-return-workflow.mjs
 */

import { selectOne, insertRow, selectRows, updateRows, deleteRows } from "../apps/api/src/supabase.js";
import { assertRuntimeConfig } from "../apps/api/src/config.js";

assertRuntimeConfig();

const BASE = "http://localhost:8787";
const TEST_PHONE = "0977654" + Math.floor(100 + Math.random() * 900);
const TEST_EMAIL = `return_test_${Date.now()}@velura.vn`;
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

  // 1. Get variants and products from DB
  const { rows: dbVariants } = await selectRows("variant");
  if (!dbVariants || dbVariants.length === 0) {
    console.error("No variants found in database. Seed first.");
    process.exit(1);
  }
  
  const variant1 = dbVariants[0];
  const product1 = await selectOne("product", { product_id: `eq.${variant1.product_id}` });
  variant1.price = product1 ? product1.sale_price || product1.base_price : 100000;

  let variant2 = dbVariants[1] || dbVariants[0];
  const product2 = await selectOne("product", { product_id: `eq.${variant2.product_id}` });
  variant2.price = product2 ? product2.sale_price || product2.base_price : 100000;

  // If we only have 1 variant, let's create a temporary variant for the same product to test price difference
  if (dbVariants.length < 2) {
    const newV = await insertRow("variant", {
      product_id: variant1.product_id,
      color: "Khác",
      size: "XL",
      sku: "TEST-SKU-DIFF-" + Date.now(),
      stock_quantity: 10,
      reserved_quantity: 0
    });
    variant2 = newV;
    variant2.price = variant1.price + 50000; // virtual higher price since it shares the product, but we want it higher
    pass(`Created temporary variant (ID: ${variant2.variant_id})`);
  }

  // Ensure variant2's product has a higher price than variant1's product for the price difference test
  const originalV2Price = product2 ? product2.sale_price || product2.base_price : 100000;
  if (variant2.price <= variant1.price) {
    if (product2 && product2.product_id !== product1.product_id) {
      await updateRows("product", { product_id: `eq.${product2.product_id}` }, { sale_price: variant1.price + 50000 });
      variant2.price = variant1.price + 50000;
      pass(`Adjusted product2 price to be higher for testing (Price: ${variant2.price})`);
    } else {
      // If they share product, we can create a temporary product for variant2 to have different price
      const tempProd = await insertRow("product", {
        sku: "TEMP-PROD-EXCH-" + Date.now(),
        category_id: product1.category_id,
        name: "Sản phẩm đổi giá cao",
        slug: "san-pham-doi-gia-cao-" + Date.now(),
        base_price: variant1.price + 50000,
        sale_price: variant1.price + 50000,
        created_at: new Date().toISOString()
      });
      const tempV = await insertRow("variant", {
        product_id: tempProd.product_id,
        color: "Màu Khác",
        size: "XXL",
        stock_quantity: 10,
        reserved_quantity: 0
      });
      variant2 = tempV;
      variant2.price = variant1.price + 50000;
      pass(`Created temporary higher-priced product & variant for exchange (Price: ${variant2.price})`);
    }
  }

  // Find or create a product category named "Phụ kiện" to test category screening
  let categoryPk = await selectOne("category", { name: "eq.Phụ kiện" });
  if (!categoryPk) {
    categoryPk = await insertRow("category", {
      name: "Phụ kiện",
      slug: "phu-kien",
      created_at: new Date().toISOString()
    });
    pass("Created category 'Phụ kiện' for restriction testing");
  }

  // Create a product inside category "Phụ kiện" with a variant
  let productPk = await selectOne("product", { sku: "eq.TAT-CO-TRUNG-BASIC" });
  if (!productPk) {
    productPk = await insertRow("product", {
      sku: "TAT-CO-TRUNG-BASIC",
      category_id: categoryPk.category_id,
      name: "Tất Cổ Trung Basic",
      slug: "tat-co-trung-basic",
      base_price: 30000,
      sale_price: 30000,
      created_at: new Date().toISOString()
    });
  }

  let variantPk = await selectOne("variant", { product_id: `eq.${productPk.product_id}` });
  if (!variantPk) {
    variantPk = await insertRow("variant", {
      product_id: productPk.product_id,
      color: "Trắng",
      size: "F",
      stock_quantity: 20
    });
  }
  variantPk.price = 30000;
  pass(`Created restricted accessory product & variant (ID: ${variantPk.variant_id})`);

  // 2. Sign up and activate a test user
  const signup = await req("/api/user/auth/signup", null, {
    method: "POST",
    body: { full_name: "Return Test User", phone: TEST_PHONE, email: TEST_EMAIL, password: TEST_PASSWORD }
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

  // Helper to create a delivered order directly in DB
  async function createDeliveredOrder(itemsArray) {
    const order = await insertRow("orders", {
      user_id: userId,
      status: "delivered",
      payment_method: "COD",
      subtotal: itemsArray.reduce((acc, it) => acc + it.price * it.qty, 0),
      shipping_fee: 30000,
      discount_amount: 0,
      total_amount: itemsArray.reduce((acc, it) => acc + it.price * it.qty, 0) + 30000,
      shipping_name: "Test Receiver",
      shipping_phone: TEST_PHONE,
      shipping_address: "456 Test Street",
      delivered_at: new Date().toISOString(), // delivered right now (within 2 days)
      created_at: new Date(Date.now() - 3600 * 1000).toISOString(), // 1 hour ago
      updated_at: new Date().toISOString()
    });

    const insertedItems = [];
    for (const it of itemsArray) {
      const inserted = await insertRow("order_item", {
        order_id: order.order_id,
        variant_id: it.variant.variant_id,
        product_name: "Sản phẩm test",
        quantity: it.qty,
        unit_price: it.price,
        subtotal_item: it.price * it.qty
      });
      insertedItems.push(inserted);
    }
    return { order, items: insertedItems };
  }

  // Helper to force mock created_at for simulation times
  async function backdateReturn(returnId, secondsAgo) {
    const pastDate = new Date(Date.now() - secondsAgo * 1000).toISOString();
    await updateRows("return_exchange", { return_id: `eq.${returnId}` }, { created_at: pastDate });
  }

  // ─────────────────────────────────────────────
  section("Tình huống 1: Hủy yêu cầu khi đang chờ xác nhận");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    
    // Create return request
    const { status, ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Yêu cầu trả hàng hoàn tiền thông thường",
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      // Cancel return request
      const cancelRes = await req("/api/user/returns/cancel", token, {
        method: "POST",
        body: { return_id: returnId }
      });

      if (cancelRes.ok && cancelRes.data.success && cancelRes.data.return.status === "rejected" && cancelRes.data.return.rejection_reason === "Đã hủy bởi khách hàng") {
        pass("Successfully cancelled return request while in pending status!");
      } else {
        fail("Cancel return request failed", cancelRes.data);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 2: Hồ sơ không đúng quy định (chụp thiếu/mác bẩn) -> Từ chối");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Yêu cầu có từ khóa violation để mô phỏng hồ sơ bẩn",
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      // Backdate to 35 seconds ago to trigger auto progress into rejected
      await backdateReturn(returnId, 35);
      
      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "rejected" && retObj.rejection_reason.includes("Không đạt tiêu chuẩn hồ sơ")) {
        pass("Auto-progressed and rejected bad return profile successfully!");
      } else {
        fail("Failed to reject bad profile", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 3: Hàng hoàn trả bị hư hỏng nặng khi kiểm kho -> Từ chối");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Yêu cầu có từ khóa transit_damage để mô phỏng hỏng nặng",
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      // Backdate to 130 seconds ago to progress through all steps to received -> rejected
      await backdateReturn(returnId, 130);

      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "rejected" && retObj.rejection_reason.includes("hư hỏng nặng")) {
        pass("Auto-progressed and rejected return request due to severe transit damage!");
      } else {
        fail("Failed to reject damaged transit goods", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 4: Hết hàng đổi mới -> Hoàn tiền");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "exchange",
        description: "Yêu cầu đổi hàng có từ khóa stock_out để mô phỏng hết hàng",
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      await backdateReturn(returnId, 130);

      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "completed" && retObj.admin_note.includes("Stock Out - Refunded instead")) {
        pass("Auto-progressed exchange requests to refund instead due to stock out successfully!");
      } else {
        fail("Failed to handle stock out redirection to refund", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 5: Chênh lệch giá (Đổi sản phẩm đắt hơn)");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "exchange",
        description: `Đổi sang variant_id có giá cao hơn. exchange_to: ${variant2.variant_id}`,
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      await backdateReturn(returnId, 130);

      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "completed" && retObj.exchange_order_id) {
        // Query the exchange order to verify price difference payment and subtotal
        const exchangeOrder = await selectOne("orders", { order_id: `eq.${retObj.exchange_order_id}` });
        const expectedDiff = variant2.price - variant1.price;
        if (exchangeOrder && Number(exchangeOrder.total_amount) === expectedDiff && exchangeOrder.payment_method === "COD") {
          pass(`Successfully created exchange order with price difference paid via COD! (Total to pay: ${exchangeOrder.total_amount})`);
        } else {
          fail("Exchange order total does not match expected price difference", exchangeOrder);
        }
      } else {
        fail("Failed to progress exchange request with price difference", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 6: Lỗi hoàn tiền từ cổng thanh toán");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Gặp lỗi cổng thanh toán payment_error",
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      await backdateReturn(returnId, 130);

      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "completed" && retObj.admin_note.includes("Refund Failed")) {
        pass("Correctly marked return request as completed but flagged refund error in admin_note!");
      } else {
        fail("Failed to flag refund failure", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 7: Đổi hàng thành công (Hao tổn nhẹ)");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "exchange",
        description: `Đổi hàng, phát hiện hao mòn nhẹ minor_damage. exchange_to: ${variant2.variant_id}`,
        items: [{ order_item_id: items[0].item_id, quantity: 1 }]
      }
    });

    if (ok && data.success) {
      const returnId = data.return.return_id;
      await backdateReturn(returnId, 130);

      const fetchRes = await req(`/api/user/returns?order_id=${order.order_id}`, token);
      const retObj = fetchRes.data.returns?.[0];
      if (retObj && retObj.status === "completed" && retObj.condition_check_result === "minor_damage" && retObj.exchange_order_id) {
        pass("Exchange request approved with minor damage and exchange order created successfully!");
      } else {
        fail("Failed to complete exchange request with minor damage", retObj);
      }
    } else {
      fail("Failed to create return request", data);
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 8: Số lượng đổi trả vượt quá số lượng đã mua");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([{ variant: variant1, qty: 1, price: variant1.price }]);
    const { status, ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Yêu cầu số lượng vượt quá đã mua",
        items: [{ order_item_id: items[0].item_id, quantity: 2 }] // only purchased 1
      }
    });

    const errMessage = data.message || data.error?.message;
    if (!ok && status === 400 && errMessage && errMessage.includes("vượt quá số lượng")) {
      pass("Correctly rejected return request when quantity exceeded purchased quantity!");
    } else {
      fail("Failed to reject return request with excessive quantity", { status, data });
    }
  }

  // ─────────────────────────────────────────────
  section("Tình huống 9: Đổi trả sản phẩm thuộc danh mục hạn chế");
  // ─────────────────────────────────────────────
  {
    const { order, items } = await createDeliveredOrder([
      { variant: variant1, qty: 1, price: variant1.price },
      { variant: variantPk, qty: 1, price: variantPk.price } // Accessory
    ]);

    const { status, ok, data } = await req("/api/user/returns", token, {
      method: "POST",
      body: {
        order_id: order.order_id,
        return_type: "refund",
        description: "Yêu cầu có phụ kiện hạn chế",
        items: [{ order_item_id: items[1].item_id, quantity: 1 }] // Accessory item
      }
    });

    const errMessage = data.message || data.error?.message;
    if (!ok && status === 400 && errMessage && errMessage.includes("hạn chế đổi trả")) {
      pass("Correctly screened and rejected return request containing restricted accessory category!");
    } else {
      fail("Failed to restrict return request of accessory category", { status, data });
    }
  }

  // Clean up database test records
  section("Cleaning up database test records");
  try {
    const { rows: testOrders } = await selectRows("orders", { user_id: `eq.${userId}` });
    
    // Phase 1: Delete all return items and return exchange records
    for (const order of testOrders) {
      const { rows: rets } = await selectRows("return_exchange", { order_id: `eq.${order.order_id}` });
      for (const ret of rets) {
        await deleteRows("return_item", { return_id: `eq.${ret.return_id}` });
      }
      await deleteRows("return_exchange", { order_id: `eq.${order.order_id}` });
    }

    // Phase 2: Delete payments, order items, and orders
    for (const order of testOrders) {
      await deleteRows("payment", { order_id: `eq.${order.order_id}` });
      await deleteRows("order_item", { order_id: `eq.${order.order_id}` });
      await deleteRows("orders", { order_id: `eq.${order.order_id}` });
    }

    await deleteRows("users", { user_id: `eq.${userId}` });
    
    // Clean up temporary accessory product and variant
    await deleteRows("variant", { variant_id: `eq.${variantPk.variant_id}` });
    await deleteRows("product", { product_id: `eq.${productPk.product_id}` });

    // Clean up temporary exchange product/variant if created
    if (variant2.sku && variant2.sku.includes("TEMP-SKU-EXCH")) {
      await deleteRows("variant", { variant_id: `eq.${variant2.variant_id}` });
      await deleteRows("product", { name: "eq.Sản phẩm đổi giá cao" });
    } else if (product2 && product2.product_id !== product1.product_id) {
      // Restore product2 price
      await updateRows("product", { product_id: `eq.${product2.product_id}` }, { sale_price: originalV2Price });
    }

    pass("Successfully cleaned up all test records.");
  } catch (e) {
    fail("Cleanup failed", e.message);
  }
}

run().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
