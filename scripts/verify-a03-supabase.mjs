const supabaseUrl = String(process.env.SUPABASE_URL || "https://drvkrpoojyncodfytftn.supabase.co").replace(/\/+$/, "");
const publishableKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_6ELMfwBsM3SFAXQz8-jmOQ_kv1kkGh7";
const adminToken = process.env.VELURA_ADMIN_ACCESS_TOKEN || "";

const schemaChecks = [
  ["orders", "order_id,user_id,status,total_amount,tracking_code,version,updated_at"],
  ["order_item", "item_id,order_id,variant_id,product_name,quantity,unit_price"],
  ["order_status_history", "history_id,order_id,old_status,new_status,trigger_type,changed_by,changed_at,note"],
  ["payment", "payment_id,order_id,payment_status,has_discrepancy,version,updated_at"]
];
const rpcChecks = [
  ["admin_change_order_status", { p_order_id: null, p_new_status: null, p_reason: null, p_tracking_code: null, p_expected_version: null, p_ip_address: null }],
  ["admin_cancel_order", { p_order_id: null, p_reason: null, p_expected_version: null, p_ip_address: null }],
  ["admin_resolve_payment", { p_order_id: null, p_payment_id: null, p_decision: null, p_reason: null, p_expected_order_version: null, p_expected_payment_version: null, p_ip_address: null }]
];

let failed = false;
console.log(`A03 production schema/RLS verification: ${supabaseUrl}`);

for (const [table, columns] of schemaChecks) {
  const response = await request(`/rest/v1/${table}?select=${columns}&limit=0`, adminToken || publishableKey);
  const anonymousDenied = [401, 403].includes(response.status)
    || (response.ok && Array.isArray(response.data) && response.data.length === 0);
  if (adminToken ? response.ok : anonymousDenied) {
    console.log(`PASS ${table} projection and ${adminToken ? "admin read" : "anonymous denial"}: HTTP ${response.status}`);
  } else {
    failed = true;
    console.error(`FAIL ${table}: HTTP ${response.status} ${response.message}`);
  }
}

for (const [rpc, body] of rpcChecks) {
  const response = await request(`/rest/v1/rpc/${rpc}`, publishableKey, body);
  if ([401, 403].includes(response.status)) {
    console.log(`PASS ${rpc} exists and rejects anonymous execution: HTTP ${response.status}`);
  } else {
    failed = true;
    console.error(`FAIL ${rpc}: expected anonymous denial, received HTTP ${response.status} ${response.message}`);
  }
}

if (!adminToken) console.log("INFO VELURA_ADMIN_ACCESS_TOKEN is not set; authenticated projection/RBAC checks were skipped.");
if (failed) {
  console.error("A03 is not release-ready. Apply migration 003 with an approved identity and rerun with an order-operator JWT.");
  process.exitCode = 1;
} else {
  console.log("A03 schema and anonymous-denial checks passed. Controlled mutation tests must run in staging, not production.");
}

async function request(path, token, body) {
  try {
    const response = await fetch(`${supabaseUrl}${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${token}`,
        accept: "application/json",
        ...(body ? { "content-type": "application/json" } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    return { ok: response.ok, status: response.status, message: detail(text), data: parse(text) };
  } catch (error) {
    return { ok: false, status: 0, message: error.message };
  }
}

function parse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function detail(text) {
  try {
    const value = JSON.parse(text);
    return value.message || value.hint || value.code || "request failed";
  } catch { return String(text || "request failed").slice(0, 200); }
}
