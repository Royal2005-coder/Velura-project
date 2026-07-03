import { selectOne } from "../apps/api/src/supabase.js";

async function run() {
  const apiBase = "http://localhost:8787";
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const testEmail = `verify_user_${randomSuffix}@velura.vn`;
  const testPhone = `0999${randomSuffix}`;
  const testPassword = "Password123!";

  console.log(`[TEST SETUP] Creating test user: Email=${testEmail}, Phone=${testPhone}`);

  try {
    // 1. Fetch products to find a suitable variant
    const productsRes = await fetch(`${apiBase}/api/user/products`);
    if (!productsRes.ok) {
      throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
    }
    const products = await productsRes.json();
    const candidate = products.find(p => !p.is_combo && p.variants && p.variants.length > 0 && p.variants.find(v => v.stock_quantity > 5));

    if (!candidate) {
      throw new Error("No suitable product/variant with stock > 5 found in database.");
    }

    const targetVariant = candidate.variants.find(v => v.stock_quantity > 5);
    const initialStock = targetVariant.stock_quantity;
    console.log(`[PRODUCT FOUND] Selected Product: "${candidate.name}" | Variant ID: ${targetVariant.variant_id} | Initial Stock: ${initialStock}`);

    // 2. Sign up user
    const signupRes = await fetch(`${apiBase}/api/user/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: "Verification Test User",
        email: testEmail,
        phone: testPhone,
        password: testPassword
      })
    });

    const signupData = await signupRes.json();
    if (!signupData.success || !signupData.otp_required) {
      throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
    }
    console.log("[SIGNUP SUCCESS] OTP required. Sending verify request...");

    // 3. Verify OTP
    const verifyRes = await fetch(`${apiBase}/api/user/auth/otp-verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: testEmail,
        otp_code: "123456"
      })
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success || !verifyData.token) {
      throw new Error(`OTP Verification failed: ${JSON.stringify(verifyData)}`);
    }
    const token = verifyData.token;
    console.log("[VERIFY OTP SUCCESS] Got authorization token.");

    const unitPrice = candidate.sale_price || candidate.base_price;
    const quantity = 2;
    const subtotal = unitPrice * quantity;
    const shippingFee = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + shippingFee - discountAmount;

    const orderPayload = {
      payment_method: "cod",
      shipping_name: "Verification User",
      shipping_phone: testPhone,
      shipping_address: "123 Test Street, Ward 1, District 1, HCMC",
      shipping_fee: shippingFee,
      discount_amount: discountAmount,
      subtotal: subtotal,
      total_amount: totalAmount,
      items: [
        {
          variant_id: targetVariant.variant_id,
          product_name: candidate.name,
          quantity: quantity,
          unit_price: unitPrice
        }
      ]
    };

    console.log("[PLACING ORDER] Sending order payload...");
    const orderRes = await fetch(`${apiBase}/api/user/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderRes.json();
    if (!orderData.success || !orderData.order || !orderData.order.order_id) {
      throw new Error(`Order placement failed: ${JSON.stringify(orderData)}`);
    }
    const orderId = orderData.order.order_id;
    console.log(`[ORDER CREATED] Order ID: ${orderId} | Status: ${orderData.order.status}`);

    // 5. Verify stock decrement
    const prodDetailRes = await fetch(`${apiBase}/api/user/products/${candidate.product_id}`);
    const prodDetail = await prodDetailRes.json();
    const updatedVariant = prodDetail.variants.find(v => v.variant_id === targetVariant.variant_id);
    const postOrderStock = updatedVariant.stock_quantity;
    console.log(`[STOCK LEVEL] Stock after placing order: ${postOrderStock}`);

    if (postOrderStock !== initialStock - 2) {
      throw new Error(`Stock decrement failed! Expected: ${initialStock - 2}, Got: ${postOrderStock}`);
    }
    console.log("✓ Stock successfully decremented by 2.");

    // 6. Verify order history tab listing
    const historyRes = await fetch(`${apiBase}/api/user/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const historyData = await historyRes.json();
    console.log("[DEBUG] History response:", JSON.stringify(historyData));
    const matchedOrder = (historyData.orders || []).find(o => o.order_id === orderId);
    if (!matchedOrder) {
      throw new Error(`Order not found in user's order history! Available orders: ${JSON.stringify(historyData.orders)}`);
    }
    console.log(`✓ Order successfully listed in history. Status: ${matchedOrder.status}`);

    // 7. Cancel order
    console.log("[CANCELLING ORDER] Patching order status to 'cancelled'...");
    const cancelRes = await fetch(`${apiBase}/api/user/orders`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: orderId,
        status: "cancelled"
      })
    });

    const cancelData = await cancelRes.json();
    if (!cancelData.success) {
      throw new Error(`Order cancellation failed: ${JSON.stringify(cancelData)}`);
    }
    console.log("[ORDER CANCELLED] Status updated successfully.");

    // 8. Verify stock restoration
    const finalProdRes = await fetch(`${apiBase}/api/user/products/${candidate.product_id}`);
    const finalProd = await finalProdRes.json();
    const finalVariant = finalProd.variants.find(v => v.variant_id === targetVariant.variant_id);
    const finalStock = finalVariant.stock_quantity;
    console.log(`[STOCK LEVEL] Stock after cancellation: ${finalStock}`);

    if (finalStock !== initialStock) {
      throw new Error(`Stock restoration failed! Expected: ${initialStock}, Got: ${finalStock}`);
    }
    console.log("✓ Stock successfully restored to initial value.");

    console.log("\n==================================================");
    console.log("🏆 ALL INTEGRATION TESTS PASSED SUCCESSFULLY! 🏆");
    console.log("==================================================\n");

  } catch (error) {
    console.error("❌ TEST FAILED:", error.message);
    process.exit(1);
  }
}

run();
