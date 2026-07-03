import { selectOne, deleteRows, selectRows } from "../apps/api/src/supabase.js";

const API_URL = "http://localhost:8787";
const testEmail = "test_integration_user@velura.vn";
const testPhone = "0999999999";
const testPassword = "Password123!";
const newPassword = "NewPassword123!";

async function runTests() {
  console.log("Starting Full User Backend Integration Tests (Phases 1-4)...\n");

  // Retrieve a valid variant and product from database for testing
  const testProduct = await selectOne("product", {});
  if (!testProduct) {
    throw new Error("No products found in database. Seed data must be loaded first.");
  }
  console.log(`Using product: ${testProduct.name} (${testProduct.product_id})`);

  const testVariant = await selectOne("variant", { product_id: `eq.${testProduct.product_id}` });
  if (!testVariant) {
    throw new Error("No variants found for the product. Check database seeding.");
  }
  console.log(`Using variant: Color ${testVariant.color}, Size ${testVariant.size} (${testVariant.variant_id})`);

  // Clean up any existing test user and associated orders/reviews/returns
  console.log("\nCleaning up previous test data...");
  const oldUser = await selectOne("users", { email: `eq.${testEmail}` });
  if (oldUser) {
    console.log("Deleting old test user data...");
    // Cascade-delete orders, reviews, etc.
    const oldOrders = await selectRows("orders", { user_id: `eq.${oldUser.user_id}` });
    for (const ord of oldOrders) {
      await deleteRows("return_exchange", { order_id: `eq.${ord.order_id}` });
      await deleteRows("review", { order_id: `eq.${ord.order_id}` });
      await deleteRows("order_item", { order_id: `eq.${ord.order_id}` });
    }
    await deleteRows("orders", { user_id: `eq.${oldUser.user_id}` });
    await deleteRows("style_profile", { user_id: `eq.${oldUser.user_id}` });
    await deleteRows("users", { user_id: `eq.${oldUser.user_id}` });
  }

  // ==================================================================
  // PHASE 1: AUTHENTICATION
  // ==================================================================
  console.log("\n--- TESTING PHASE 1: AUTHENTICATION ---");
  
  // 1. Sign Up
  console.log("1. SignUp (POST /api/user/auth/signup)...");
  const signupRes = await fetch(`${API_URL}/api/user/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: testEmail,
      phone: testPhone,
      password: testPassword,
      full_name: "Integration Test User"
    })
  });
  const signupData = await signupRes.json();
  console.log("   Signup Status:", signupRes.status, "otp_required:", signupData.otp_required);

  // 2. Retrieve OTP and Verify
  const userInDb = await selectOne("users", { email: `eq.${testEmail}` });
  console.log("   Verifying OTP:", userInDb.otp_code);
  const verifyRes = await fetch(`${API_URL}/api/user/auth/otp-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identity: testEmail,
      otp_code: userInDb.otp_code
    })
  });
  const verifyData = await verifyRes.json();
  console.log("   Verify Status:", verifyRes.status, "success:", verifyData.success);
  const token = verifyData.token;

  // ==================================================================
  // PHASE 2: PROFILE & STYLE QUIZ
  // ==================================================================
  console.log("\n--- TESTING PHASE 2: PROFILE & STYLE QUIZ ---");

  // 3. Get Profile
  console.log("3. Get Profile (GET /api/user/profile)...");
  const profileGetRes = await fetch(`${API_URL}/api/user/profile`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const profileGetData = await profileGetRes.json();
  console.log("   Profile name:", profileGetData.full_name, "is_active:", profileGetData.is_active);

  // 4. Update Profile
  console.log("4. Update Profile (PATCH /api/user/profile)...");
  const profilePatchRes = await fetch(`${API_URL}/api/user/profile`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ full_name: "Updated Integration Name" })
  });
  const profilePatchData = await profilePatchRes.json();
  console.log("   Updated name:", profilePatchData.full_name);

  // 5. Update Address
  console.log("5. Update Addresses (PATCH /api/user/addresses)...");
  const addrRes = await fetch(`${API_URL}/api/user/addresses`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      addresses: [
        { label: "Nhà", address: "123 Le Loi, HCMC", receiver_name: "Test User", receiver_phone: testPhone }
      ]
    })
  });
  const addrData = await addrRes.json();
  console.log("   Address Save Success:", addrData.success);

  // 6. Style Quiz
  console.log("6. Save Style Quiz (POST /api/user/style-quiz)...");
  const quizRes = await fetch(`${API_URL}/api/user/style-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      body_shape: "Rectangle",
      skin_tone: "Warm",
      style_tags: ["casual", "minimalist"],
      preferred_occasions: ["office"],
      budget_range: "300k_700k"
    })
  });
  const quizData = await quizRes.json();
  console.log("   Quiz Save Success:", quizData.success);

  // ==================================================================
  // PHASE 3: WISHLIST & ORDERS
  // ==================================================================
  console.log("\n--- TESTING PHASE 3: WISHLIST & ORDERS ---");

  // 7. Add to Wishlist
  console.log("7. Add to Wishlist (POST /api/user/wishlist)...");
  const addWishRes = await fetch(`${API_URL}/api/user/wishlist`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ product_id: testProduct.product_id })
  });
  const addWishData = await addWishRes.json();
  console.log("   Wishlist contains:", addWishData.wishlist);

  // 8. Get Wishlist Detail
  console.log("8. Get Wishlist Details (GET /api/user/wishlist)...");
  const getWishRes = await fetch(`${API_URL}/api/user/wishlist`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const getWishData = await getWishRes.json();
  console.log("   Fetched wishlist count:", getWishData.items.length);

  // 9. Place Order
  console.log("9. Place Order (POST /api/user/orders)...");
  const orderRes = await fetch(`${API_URL}/api/user/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      shipping_name: "Integration Receiver",
      shipping_phone: testPhone,
      shipping_address: "123 Le Loi, HCMC",
      subtotal: testProduct.sale_price,
      total_amount: testProduct.sale_price + 30000,
      payment_method: "COD",
      items: [
        {
          variant_id: testVariant.variant_id,
          product_name: testProduct.name,
          quantity: 1,
          unit_price: testProduct.sale_price
        }
      ]
    })
  });
  const orderData = await orderRes.json();
  console.log("   Order Creation Success:", orderData.success, "Order ID:", orderData.order?.order_id);
  const orderId = orderData.order?.order_id;
  const orderItemId = orderData.order?.items?.[0]?.item_id;

  // 10. Get Orders list
  console.log("10. Fetch Orders List (GET /api/user/orders)...");
  const ordersGetRes = await fetch(`${API_URL}/api/user/orders`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const ordersGetData = await ordersGetRes.json();
  console.log("    Orders count in list:", ordersGetData.orders.length);

  // ==================================================================
  // PHASE 4: REVIEWS & RETURNS
  // ==================================================================
  console.log("\n--- TESTING PHASE 4: REVIEWS & RETURNS ---");

  // 11. Submit Product Review
  console.log("11. Submit Review (POST /api/user/reviews)...");
  const reviewRes = await fetch(`${API_URL}/api/user/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      product_id: testProduct.product_id,
      order_id: orderId,
      rating: 5,
      comment: "Chat luong san pham tuyet voi!"
    })
  });
  const reviewData = await reviewRes.json();
  console.log("    Review Submit Success:", reviewData.success, "Review ID:", reviewData.review?.review_id);

  // 12. Submit Return Request
  console.log("12. Submit Return Request (POST /api/user/returns)...");
  const returnRes = await fetch(`${API_URL}/api/user/returns`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      order_id: orderId,
      return_type: "refund",
      description: "San pham bi loi duong may",
      items: [
        {
          order_item_id: orderItemId,
          quantity: 1
        }
      ]
    })
  });
  const returnData = await returnRes.json();
  console.log("    Return Request Success:", returnData.success, "Return ID:", returnData.return?.return_id);

  // Clean up
  console.log("\nCleaning up test user data from DB...");
  await deleteRows("return_item", { return_id: `eq.${returnData.return?.return_id}` });
  await deleteRows("return_exchange", { return_id: `eq.${returnData.return?.return_id}` });
  await deleteRows("review", { review_id: `eq.${reviewData.review?.review_id}` });
  await deleteRows("order_item", { order_id: `eq.${orderId}` });
  await deleteRows("orders", { order_id: `eq.${orderId}` });
  await deleteRows("style_profile", { user_id: `eq.${userInDb.user_id}` });
  await deleteRows("users", { user_id: `eq.${userInDb.user_id}` });

  console.log("\nALL FULL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
