import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();

async function source(relativePath) {
  const normalizedPath = relativePath.startsWith("src/") ? `apps/admin-web/${relativePath}` : relativePath;
  return readFile(path.join(ROOT, normalizedPath), "utf8");
}

test("admin browser code delegates identity and RBAC to the backend", async () => {
  const [login, callback, admin, auth] = await Promise.all([
    source("src/pages/admin/login.html"),
    source("src/pages/admin/auth-callback.html"),
    source("src/scripts/admin.js"),
    source("src/scripts/auth.js")
  ]);

  const browserCode = `${login}\n${callback}\n${admin}`;
  assert.doesNotMatch(browserCode, /from\(["']users["']\)/i);
  assert.doesNotMatch(browserCode, /\/rest\/v1\/users/i);
  assert.doesNotMatch(browserCode, /select\(["']\*["']\)/i);
  assert.doesNotMatch(browserCode, /password_hash|otp_code/i);
  assert.doesNotMatch(browserCode, /Velura@123|reset123/i);
  assert.match(auth, /fetchAuthContext\s*\(/);
  assert.match(callback, /establishAuthoritativeSession\s*\(/);
});

test("Supabase OAuth: manual PKCE verifier, correct redirect_uri, raw exchange", async () => {
  const [login, callback] = await Promise.all([
    source("src/pages/admin/login.html"),
    source("src/pages/admin/auth-callback.html")
  ]);

  // Login must generate its own PKCE code_verifier using Web Crypto API,
  // store in a custom localStorage key, and redirect to Supabase authorize
  // with the code_challenge — NOT rely on the Supabase client's internal PKCE.
  assert.match(login, /generateCodeVerifier\(/);
  assert.match(login, /computeCodeChallenge\(/);
  assert.match(login, /localStorage\.setItem\(PKCE_STORAGE_KEY/);
  assert.match(login, /code_challenge_method=s256/);
  assert.match(login, /velura-oauth-pkce-code-verifier/);

  // Login must NOT use sessionStorage for the PKCE verifier.
  assert.doesNotMatch(login, /storage:\s*window\.sessionStorage/);

  // Callback must use direct fetch to /auth/v1/token?grant_type=pkce with
  // redirect_uri = origin + pathname (NOT window.location.href which includes
  // ?code=...&state=... and causes flow_state_not_found).
  assert.match(callback, /token\?grant_type=pkce/);
  assert.match(callback, /redirect_uri:\s*REDIRECT_URI/);
  assert.match(callback, /const REDIRECT_URI\s*=\s*window\.location\.origin\s*\+\s*window\.location\.pathname/);

  // Callback must read verifier from the same custom key as login.
  assert.match(callback, /velura-oauth-pkce-code-verifier/);
  assert.match(callback, /localStorage\.getItem\(VERIFIER_KEY\)/);

  // Callback must set accessToken from raw token response, not from Supabase client session.
  assert.match(callback, /setAccessToken\(/);
});

test("password changes use Supabase Auth and production password policy", async () => {
  const page = await source("src/pages/admin/change-password.html");
  assert.match(page, /client\.auth\.updateUser\(\{\s*password:/);
  assert.match(page, /client\.auth\.signInWithPassword/);
  assert.match(page, /value\.length\s*>=\s*12/);
  assert.doesNotMatch(page, /changePassword.*auth-core|mustChangePassword|Velura@123/i);
});

test("active seed directory contains no privilege hotfix SQL", async () => {
  const seedDirectory = path.join(ROOT, "database", "seed");
  const entries = await readdir(seedDirectory);
  assert.deepEqual(entries.filter((name) => name.endsWith(".sql")), []);
  const readme = await source("database/seed/README.md");
  assert.match(readme, /seed-admin-users\.mjs/);
});

test("account table rendering escapes untrusted database values", async () => {
  const admin = await source("src/scripts/admin.js");
  assert.match(admin, /function escapeHtml\s*\(/);
  assert.match(admin, /escapeHtml\(row\.full_name/);
  assert.match(admin, /escapeHtml\(row\.email/);
  assert.match(admin, /accountApi\.list\s*\(/);
  assert.doesNotMatch(admin, /db\.js|\bdb\.|allowDemoData/);
});

test("product administration uses the versioned API and encodes database values", async () => {
  const [products, api] = await Promise.all([
    source("src/scripts/products.js"),
    source("src/scripts/product-api.js")
  ]);
  assert.doesNotMatch(products, /from\s+["']\.\/db\.js["']|db\.getProducts|localStorage/);
  assert.match(products, /function escapeHtml\s*\(/);
  assert.match(products, /productApi\.list\s*\(/);
  assert.match(products, /productApi\.updateStock\s*\(/);
  assert.match(products, /productApi\.commitCsv\s*\(/);
  assert.doesNotMatch(products, /import-csv\/commit.*fetch|API_BASE_URL|getAccessToken\(/s);
  assert.match(api, /\/api\/v1\/admin\/products/);
  assert.match(api, /commitCsv\s*\(/);
  assert.doesNotMatch(api, /\/rest\/v1\/product/);
});

test("dashboard backend reads canonical Supabase production tables", async () => {
  const dashboard = await source("apps/api/src/dashboard.js");
  assert.match(dashboard, /safeSelect\("product"/);
  assert.match(dashboard, /safeSelect\("variant"/);
  assert.match(dashboard, /safeSelect\("review"/);
  assert.match(dashboard, /safeSelect\("return_exchange"/);
  assert.match(dashboard, /safeSelect\("support_ticket"/);
  assert.doesNotMatch(dashboard, /safeSelect\("products"|safeSelect\("reviews"|safeSelect\("return_requests"|safeSelect\("support_tickets"/);
});

test("admin registration page has no demo account creation path", async () => {
  const register = await source("src/pages/admin/register.html");
  assert.doesNotMatch(register, /auth-core|Velura@123|Google OAuth Demo|register\(|loginWithGoogle/);
  assert.match(register, /Dang ky admin da tat trong production/);
});

test("order administration uses the typed API without mock database access", async () => {
  const source = await readFile(new URL("../../apps/admin-web/src/scripts/orders.js", import.meta.url), "utf8");
  const api = await readFile(new URL("../../apps/admin-web/src/scripts/order-api.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /from ["']\.\/db\.js["']/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.match(source, /escapeHtml/);
  assert.match(source, /orderApi\.(list|get|changeStatus|cancel|resolvePayment)/);
  assert.match(api, /\/api\/v1\/admin\/orders/);
  assert.doesNotMatch(api, /\/rest\/v1\//);
});

test("A04-A06 admin pages use typed APIs and escape Supabase values", async () => {
  const entries = [
    ["src/scripts/reviews.js", "reviewApi", "escapeReviewHtml"],
    ["src/scripts/returns-cskh.js", "returnApi", "escapeServiceHtml"],
    ["src/scripts/pricing.js", "pricingApi", "escapePricingHtml"],
    ["src/scripts/promotions.js", "pricingApi", "escapePromotionHtml"]
  ];
  for (const [file, apiName, escapeName] of entries) {
    const browserSource = await source(file);
    assert.doesNotMatch(browserSource, /from\s+["']\.\/db\.js["']|\bdb\.|localStorage|\/rest\/v1\//);
    assert.match(browserSource, new RegExp(`${apiName}\\.`));
    assert.match(browserSource, new RegExp(`function ${escapeName}\\s*\\(`));
  }
});

test("source tree contains no hard-coded Supabase management or secret key", async () => {
  const candidates = [
    "scripts/verify-a01-supabase.mjs",
    "scripts/verify-a02-supabase.mjs",
    "scripts/verify-a03-supabase.mjs",
    "scripts/verify-lifecycle.js",
    ".env.example"
  ];
  const combined = (await Promise.all(candidates.map(source))).join("\n");
  assert.doesNotMatch(combined, /sbp_[A-Za-z0-9]{20,}|sb_secret_[A-Za-z0-9_-]{20,}/);
  assert.doesNotMatch(combined, /postgresql:\/\/[^\s]+:[^\s\[]+@/);
});
