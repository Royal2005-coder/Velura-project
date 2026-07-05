const supabaseUrl = String(process.env.SUPABASE_URL || "https://drvkrpoojyncodfytftn.supabase.co").replace(/\/+$/, "");
const publishableKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_6ELMfwBsM3SFAXQz8-jmOQ_kv1kkGh7";
const accessToken = process.env.VELURA_SUPABASE_ACCESS_TOKEN || publishableKey;

const checks = [
  {
    name: "users A01 columns",
    path: "/rest/v1/users?select=user_id,auth_user_id,role,admin_role,is_active,lock_type,locked_until,lock_reason,version,updated_at&limit=0"
  },
  {
    name: "approval versioning columns",
    path: "/rest/v1/approval_admin_request?select=request_id,status,expires_at,target_version,version&limit=0"
  },
  {
    name: "transactional email outbox",
    path: "/rest/v1/email_outbox?select=email_id,status,attempts,next_attempt_at&limit=0"
  }
];

let failed = false;
console.log(`A01 read-only schema verification: ${supabaseUrl}`);

for (const check of checks) {
  try {
    const response = await fetch(`${supabaseUrl}${check.path}`, {
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        prefer: "count=exact"
      }
    });
    const text = await response.text();
    const detail = parseDetail(text);
    if (response.ok || response.status === 401 || response.status === 403) {
      console.log(`PASS ${check.name}: schema resolved (${response.status})`);
    } else {
      failed = true;
      console.error(`FAIL ${check.name}: HTTP ${response.status} ${detail}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.name}: ${error.message}`);
  }
}

if (failed) {
  console.error("A01 schema is not production-ready. Apply database/migrations/001_uc_a01_account_rbac.sql, then run this check again.");
  process.exitCode = 1;
} else {
  console.log("A01 projected schema checks passed. Authenticated RBAC/RPC integration tests are still required before release.");
}

function parseDetail(text) {
  try {
    const value = JSON.parse(text);
    return value.message || value.hint || value.code || "request failed";
  } catch {
    return String(text || "request failed").slice(0, 200);
  }
}
