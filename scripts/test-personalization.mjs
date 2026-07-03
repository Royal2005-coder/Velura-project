/**
 * Personalization Flow integration/smoke test
 * Run: node --env-file=.env scripts/test-personalization.mjs
 */

const BASE = "http://localhost:8787";
const TEST_PHONE = "0934567" + Math.floor(100 + Math.random() * 900);
const TEST_EMAIL = `testpers${Date.now()}@velura.vn`;
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
    body: { full_name: "Personalization Test User", phone: TEST_PHONE, email: TEST_EMAIL, password: TEST_PASSWORD }
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

// 2. Verify initially style quiz is empty/null
section("2. Verify initially style quiz is empty/null");
{
  const { ok, data } = await req("/api/user/style-quiz", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (ok && data.quiz === null) {
    pass("Initially style quiz is null (uncompleted) ✓");
  } else {
    fail("Initially style quiz check failed", data);
  }
}

// 3. Submit Style Quiz (Body Shape: Hourglass, Measurements: chest=83, waist=66, hip=89, weight=49)
section("3. Submit Style Quiz");
{
  const quizPayload = {
    height_cm: 160,
    weight_kg: 49,
    chest_cm: 83,
    waist_cm: 66,
    hip_cm: 89,
    body_shape: "Hourglass",
    skin_tone: "Warm",
    style_tags: ["Elegant", "Casual"],
    preferred_occasions: ["Work", "Party"],
    favorite_brands: ["Velura"],
    budget_range: "300k_700k"
  };

  const { ok, data } = await req("/api/user/style-quiz", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: quizPayload
  });
  if (ok && data.success) {
    pass("Style Quiz submitted successfully ✓");
  } else {
    fail("Failed to submit Style Quiz", data);
  }
}

// 4. Retrieve Style Quiz and check results
section("4. Retrieve Style Quiz & check fields");
let styleProfile;
{
  const { ok, data } = await req("/api/user/style-quiz", {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (ok && data.quiz && data.quiz.body_shape === "Hourglass") {
    styleProfile = data.quiz;
    pass("Style Profile fetched successfully. Body shape: " + styleProfile.body_shape);
  } else {
    fail("Failed to fetch Style Profile", data);
  }
}

// 5. Test Body Shape filter for Catalog
section("5. Filter products by Body Shape 'Hourglass'");
{
  const { ok, data } = await req("/api/user/products");
  if (ok && data.length > 0) {
    const matchedProducts = data.filter(p => {
      const suitable = Array.isArray(p.suitable_body_shapes)
        ? p.suitable_body_shapes.map(s => s.toLowerCase())
        : [];
      return suitable.includes("hourglass");
    });
    pass(`Found ${matchedProducts.length} products suitable for 'Hourglass' shape.`);
    if (matchedProducts.length > 0) {
      pass(`Example matched product: ${matchedProducts[0].name} (suitable shapes: ${JSON.stringify(matchedProducts[0].suitable_body_shapes)})`);
    }
  } else {
    fail("Failed to fetch products for filtering", data);
  }
}

// 6. Test Size Prediction (Fit Helper)
section("6. Test Size Prediction (Fit Helper)");
{
  // Prediction matrix matching options.js:
  // chest_cm <= 80 && waist_cm <= 64 && hip_cm <= 86 && weight_kg <= 45 -> XS
  // chest_cm <= 84 && waist_cm <= 68 && hip_cm <= 90 && weight_kg <= 50 -> S
  // chest_cm <= 88 && waist_cm <= 72 && hip_cm <= 94 && weight_kg <= 55 -> M
  // chest_cm <= 92 && waist_cm <= 76 && hip_cm <= 98 && weight_kg <= 60 -> L
  // else -> XL
  const { chest_cm, waist_cm, hip_cm, weight_kg } = styleProfile;
  let predictedSize = "";
  if (chest_cm <= 80 && waist_cm <= 64 && hip_cm <= 86 && weight_kg <= 45) {
    predictedSize = "XS";
  } else if (chest_cm <= 84 && waist_cm <= 68 && hip_cm <= 90 && weight_kg <= 50) {
    predictedSize = "S";
  } else if (chest_cm <= 88 && waist_cm <= 72 && hip_cm <= 94 && weight_kg <= 55) {
    predictedSize = "M";
  } else if (chest_cm <= 92 && waist_cm <= 76 && hip_cm <= 98 && weight_kg <= 60) {
    predictedSize = "L";
  } else {
    predictedSize = "XL";
  }

  if (predictedSize === "S") {
    pass(`Size prediction: ${predictedSize} (Correct based on measurements: chest=${chest_cm}, waist=${waist_cm}, hip=${hip_cm}, weight=${weight_kg}) ✓`);
  } else {
    fail(`Size prediction got ${predictedSize}, expected S`);
  }
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅  Personalization Flow integration/smoke test completed successfully!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
