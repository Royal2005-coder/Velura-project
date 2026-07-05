const supabaseUrl = String(process.env.SUPABASE_URL || process.env.VELURA_SUPABASE_URL || "https://drvkrpoojyncodfytftn.supabase.co").replace(/\/+$/, "");
const publishableKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VELURA_SUPABASE_ANON_KEY || "sb_publishable_6ELMfwBsM3SFAXQz8-jmOQ_kv1kkGh7";
const adminToken = process.env.VELURA_ADMIN_ACCESS_TOKEN || "";

const schemaChecks = [
  {
    name: "product base/sale pricing projection",
    path: "/rest/v1/product?select=product_id,sku,base_price,sale_price,version,updated_at&limit=0",
    token: publishableKey,
    mode: "public-ok"
  },
  {
    name: "price history full base/sale projection",
    path: `/rest/v1/price_history?select=price_history_id,product_id,old_base_price,new_base_price,old_sale_price,new_sale_price,changed_by,changed_at,reason&limit=${adminToken ? "0" : "1"}`,
    token: adminToken || publishableKey,
    mode: adminToken ? "admin-ok" : "anonymous-empty-or-denied"
  },
  {
    name: "promotion pricing tables",
    path: "/rest/v1/promotion?select=promo_id,promo_name,promo_type,start_date,end_date,is_active,budget_limit,total_discount_issued,version&limit=0",
    token: publishableKey,
    mode: "public-ok"
  },
  {
    name: "voucher pricing tables",
    path: "/rest/v1/voucher?select=voucher_id,promo_id,code,name,discount_type,discount_value,is_active,used_count,version&limit=0",
    token: publishableKey,
    mode: "public-ok"
  }
];

const rpcChecks = [
  [
    "admin_change_product_price",
    {
      p_product_id: null,
      p_new_base_price: null,
      p_new_sale_price: null,
      p_reason: null,
      p_expected_version: null,
      p_ip_address: null
    }
  ]
];

let failed = false;
console.log(`A06 pricing/promotion Supabase verification: ${supabaseUrl}`);

for (const check of schemaChecks) {
  const response = await request(check.path, check.token);
  if (check.mode === "anonymous-empty-or-denied") {
    if (isDenied(response.status) || (response.ok && Array.isArray(response.data) && response.data.length === 0)) {
      console.log(`PASS ${check.name} does not expose anonymous rows: HTTP ${response.status}`);
    } else {
      failed = true;
      console.error(`FAIL ${check.name}: anonymous request can read rows or unexpected response HTTP ${response.status} ${response.message}`);
    }
  } else if (response.ok) {
    console.log(`PASS ${check.name}: HTTP ${response.status}`);
  } else {
    failed = true;
    console.error(`FAIL ${check.name}: HTTP ${response.status} ${response.message}`);
  }
}

for (const [rpc, body] of rpcChecks) {
  const response = await request(`/rest/v1/rpc/${rpc}`, publishableKey, body);
  if (isDenied(response.status)) {
    console.log(`PASS ${rpc} exists with base/sale signature and rejects anonymous execution: HTTP ${response.status}`);
  } else {
    failed = true;
    console.error(`FAIL ${rpc}: expected anonymous denial for base/sale signature, received HTTP ${response.status} ${response.message}`);
  }
}

if (!adminToken) console.log("INFO VELURA_ADMIN_ACCESS_TOKEN is not set; authenticated price_history projection was skipped.");
if (failed) {
  console.error("A06 is not release-ready. Apply database/migrations/008_uc_a06_base_sale_price_update.sql with an approved migration identity.");
  process.exitCode = 1;
} else {
  console.log("A06 schema and anonymous-denial checks passed. Controlled price mutation tests must run in staging, not production.");
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

function isDenied(status) {
  return status === 401 || status === 403;
}

function parse(text) {
  try { return JSON.parse(text); } catch { return null; }
}

function detail(text) {
  try {
    const value = JSON.parse(text);
    return value.message || value.hint || value.code || "request failed";
  } catch {
    return String(text || "request failed").slice(0, 200);
  }
}
