/**
 * Auth smoke test - kiểm tra toàn bộ flow đăng ký / đăng nhập / quên mật khẩu
 * Chạy: node --env-file=.env scripts/test-auth.mjs
 */

const BASE = "http://localhost:8787";
const TEST_PHONE = "0912345" + Math.floor(100 + Math.random() * 900);
const TEST_EMAIL = `test${Date.now()}@velura.vn`;
const TEST_PASSWORD = "Velura@2025";
const NEW_PASSWORD  = "Velura@2026";

let capturedOtp = null;

// Monkey-patch console.log to intercept OTP printed by server (won't work cross-process,
// but we use fallback OTP=123456 via dev-mode bypass)
const DEV_OTP = "123456"; // server allows this in dev

async function req(path, opts = {}) {
  const url = `${BASE}${path}`;
  const method = opts.method || "GET";
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
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

// ─────────────────────────────────────────────
section("0. Health check");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req("/health");
  if (ok && data.ok) pass("GET /health → OK");
  else { fail("GET /health", data); process.exit(1); }
}

// ─────────────────────────────────────────────
section("1. Check-exists (phone not registered)");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req(`/api/user/auth/check-exists?phone=${TEST_PHONE}`);
  if (ok && data.exists === false) pass("check-exists: phone not yet registered");
  else fail("check-exists (phone)", data);
}

// ─────────────────────────────────────────────
section("2. Sign Up");
// ─────────────────────────────────────────────
let signupRes;
{
  signupRes = await req("/api/user/auth/signup", {
    method: "POST",
    body: { full_name: "Velura Test User", phone: TEST_PHONE, email: TEST_EMAIL, password: TEST_PASSWORD }
  });
  if (signupRes.ok && signupRes.data.otp_required) pass("POST /signup → otp_required=true");
  else fail("POST /signup", signupRes.data);
}

// ─────────────────────────────────────────────
section("3. OTP Verify (activate account, dev OTP)");
// ─────────────────────────────────────────────
let token, userId;
{
  const { ok, data } = await req("/api/user/auth/otp-verify", {
    method: "POST",
    body: { identity: TEST_PHONE, otp_code: DEV_OTP }
  });
  if (ok && data.token) {
    pass("POST /otp-verify → token issued, account activated");
    token = data.token;
    userId = data.user?.user_id;
  } else fail("POST /otp-verify", data);
}

// ─────────────────────────────────────────────
section("4. Check-exists (phone now registered)");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req(`/api/user/auth/check-exists?phone=${TEST_PHONE}`);
  if (ok && data.exists === true) pass("check-exists: phone now registered ✓");
  else fail("check-exists after signup", data);
}

// ─────────────────────────────────────────────
section("5. Sign In (correct password)");
// ─────────────────────────────────────────────
let loginToken;
{
  const { ok, data } = await req("/api/user/auth/signin", {
    method: "POST",
    body: { phone: TEST_PHONE, password: TEST_PASSWORD }
  });
  if (ok && data.token) {
    pass("POST /signin → token issued");
    loginToken = data.token;
  } else fail("POST /signin", data);
}

// ─────────────────────────────────────────────
section("6. Sign In (wrong password - attempt 1)");
// ─────────────────────────────────────────────
{
  const { status, data } = await req("/api/user/auth/signin", {
    method: "POST",
    body: { phone: TEST_PHONE, password: "WrongPass@1" }
  });
  if (status === 401) pass("Wrong password → 401 Unauthorized (4 attempts left)");
  else fail("Wrong password should return 401", data);
}

// ─────────────────────────────────────────────
section("7. Access /api/user/profile with token");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req("/api/user/profile", {
    headers: { Authorization: `Bearer ${loginToken}` }
  });
  if (ok && data.phone === TEST_PHONE) pass("GET /profile → returned user data");
  else fail("GET /profile", data);
}

// ─────────────────────────────────────────────
section("8. OTP Send (forgot password flow)");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req("/api/user/auth/otp-send", {
    method: "POST",
    body: { identity: TEST_EMAIL }
  });
  if (ok && data.success) pass("POST /otp-send → OTP generated (check server console)");
  else fail("POST /otp-send", data);
}

// ─────────────────────────────────────────────
section("9. Reset Password");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req("/api/user/auth/reset-password", {
    method: "POST",
    body: { identity: TEST_EMAIL, otp_code: DEV_OTP, password: NEW_PASSWORD }
  });
  if (ok && data.success) pass("POST /reset-password → password changed");
  else fail("POST /reset-password", data);
}

// ─────────────────────────────────────────────
section("10. Sign In with NEW password");
// ─────────────────────────────────────────────
{
  const { ok, data } = await req("/api/user/auth/signin", {
    method: "POST",
    body: { phone: TEST_PHONE, password: NEW_PASSWORD }
  });
  if (ok && data.token) pass("POST /signin (new pw) → login successful ✓");
  else fail("POST /signin (new pw)", data);
}

// ─────────────────────────────────────────────
section("11. Sign In with OLD password (should fail)");
// ─────────────────────────────────────────────
{
  const { status } = await req("/api/user/auth/signin", {
    method: "POST",
    body: { phone: TEST_PHONE, password: TEST_PASSWORD }
  });
  if (status === 401) pass("Old password → 401 correctly rejected");
  else fail("Old password should be rejected");
}

// ─────────────────────────────────────────────
section("12. Validation: Weak password");
// ─────────────────────────────────────────────
{
  const { status, data } = await req("/api/user/auth/signup", {
    method: "POST",
    body: { full_name: "Test User", phone: "0900000001", password: "weak" }
  });
  if (status === 400) pass("Weak password → 400 validation error");
  else fail("Weak password should be rejected", data);
}

// ─────────────────────────────────────────────
section("13. Validation: Duplicate phone");
// ─────────────────────────────────────────────
{
  const { status, data } = await req("/api/user/auth/signup", {
    method: "POST",
    body: { full_name: "Dup User", phone: TEST_PHONE, password: TEST_PASSWORD }
  });
  if (status === 400) pass("Duplicate phone → 400 DUPLICATE_ACCOUNT");
  else fail("Duplicate phone should be rejected", data);
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("✅  Auth smoke test hoàn thành!");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
