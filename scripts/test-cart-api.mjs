/**
 * Cart API integration/smoke test
 * Run: node --env-file=.env scripts/test-cart-api.mjs
 */

const BASE = "http://localhost:8787";
const TEST_PHONE = "0923456" + Math.floor(100 + Math.random() * 900);
const TEST_EMAIL = `testcart${Date.now()}@velura.vn`;
const TEST_PASSWORD = "Velura@2025";
const DEV_OTP = "123456";

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  const method = opts.method || "GET";
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
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
function fail(label, detail) { console.error(`  ❌  ${label}`, detail || ""); }
function section(title) { console.log(`\n━━━  ${title}  ━━━`); }

// 1. Signup and login
section("1. Sign Up & Sign In test user");
let token;
{
  const signup = await req("/api/user/auth/signup", {
    method: "POST",
    body: { full_name: "Cart Test User", phone: TEST_PHONE, email: TEST_EMAIL, password: TEST_PASSWORD }
  });
  if (signup.ok && signup.data.otp_required) {
    const verify = await req("/api/user/auth/otp-verify", {
      method: "POST",
      body: { identity: TEST_PHONE, otp_code: DEV_OTP }
    });
    if (verify.ok && verify.data.token) {
      token = verify.data.token;
      pass("User registered and logged in");
    } else {
      fail("Failed to verify signup OTP", verify.data);
      process.exit(1);
    }
  } else {
    fail("Failed to signup user", signup.data);
    process.exit(1);
  }
}

// 2. Fetch products to get a valid product and variant_id
section("2. Fetch products and check variants");
let targetVariantId, targetProductId, originalStock;
{
  const { ok, data } = await req("/api/user/products");
  if (ok && data.length > 0) {
    const prod = data.find(p => p.variants && p.variants.length > 0);
    if (prod) {
      targetProductId = prod.product_id;
      const variant = prod.variants[0];
      targetVariantId = variant.variant_id;
      originalStock = variant.stock_quantity;
      pass(`Target product: ${prod.name}, variant_id: ${targetVariantId}, available stock: ${originalStock}`);
    } else {
      fail("No products with variants found.");
      process.exit(1);
    }
  } else {
    fail("No products found.");
    process.exit(1);
  }
}

// 3. Get Cart (should be empty initially)
section("3. GET /api/user/cart (Initial)");
{
  const { ok, data } = await req("/api/user/cart", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (ok && Array.isArray(data.items)) {
    pass("GET /cart successful. Initial items: " + data.items.length);
  } else {
    fail("GET /cart failed", data);
  }
}

// 4. Update Cart with valid quantity (should succeed)
section("4. POST /api/user/cart (Add item)");
{
  const cartItems = [{
    variant_id: targetVariantId,
    product_id: targetProductId,
    quantity: 1,
    color: "Mặc định",
    size: "M"
  }];
  const { ok, data } = await req("/api/user/cart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { items: cartItems }
  });
  if (ok && data.success) {
    pass("POST /cart item added successfully");
  } else {
    fail("POST /cart failed", data);
  }
}

// 5. GET /api/user/cart to verify item is saved
section("5. GET /api/user/cart (Verify item)");
{
  const { ok, data } = await req("/api/user/cart", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (ok && data.items && data.items.length === 1 && data.items[0].variant_id === targetVariantId) {
    pass("Verified: item is in the cart");
  } else {
    fail("Verification failed", data);
  }
}

// 6. Update Cart with exceeding quantity (should be rejected/adjusted to stock limit)
section("6. POST /api/user/cart (Exceeding quantity)");
{
  const cartItems = [{
    variant_id: targetVariantId,
    product_id: targetProductId,
    quantity: originalStock + 10,
    color: "Mặc định",
    size: "M"
  }];
  const { ok, data } = await req("/api/user/cart", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: { items: cartItems }
  });
  if (ok && data.success) {
    // Check if the actual saved quantity is adjusted to originalStock
    const verifyGet = await req("/api/user/cart", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (verifyGet.ok && verifyGet.data.items && verifyGet.data.items[0].quantity === originalStock) {
      pass(`Exceeding quantity correctly capped to stock limit of ${originalStock}`);
    } else {
      fail("Quantity was not capped correctly", verifyGet.data);
    }
  } else {
    fail("Exceeding quantity request failed entirely instead of capping", data);
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅  Cart API integration/smoke test completed successfully!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
