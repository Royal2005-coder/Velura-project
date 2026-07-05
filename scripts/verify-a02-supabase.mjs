const supabaseUrl = String(process.env.SUPABASE_URL || "https://drvkrpoojyncodfytftn.supabase.co").replace(/\/+$/, "");
const publishableKey = process.env.SUPABASE_ANON_KEY || "sb_publishable_6ELMfwBsM3SFAXQz8-jmOQ_kv1kkGh7";

const checks = [
  {
    name: "public product catalog and A02 versioning",
    path: "/rest/v1/product?select=product_id,sku,name,category_id,status,version,updated_at&limit=0"
  },
  {
    name: "public variant catalog and inventory versioning",
    path: "/rest/v1/variant?select=variant_id,product_id,stock_quantity,reserved_quantity,low_stock_threshold,version,updated_at&limit=0"
  },
  {
    name: "public category catalog",
    path: "/rest/v1/category?select=category_id,name,parent_id,slug,display_order&limit=0"
  }
];

let failed = false;
console.log(`A02 read-only schema/RLS verification: ${supabaseUrl}`);

for (const check of checks) {
  try {
    const response = await fetch(`${supabaseUrl}${check.path}`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${publishableKey}`, accept: "application/json" }
    });
    const text = await response.text();
    if (response.ok) {
      console.log(`PASS ${check.name}: HTTP ${response.status}`);
    } else {
      failed = true;
      console.error(`FAIL ${check.name}: HTTP ${response.status} ${detail(text)}`);
    }
  } catch (error) {
    failed = true;
    console.error(`FAIL ${check.name}: ${error.message}`);
  }
}

if (failed) {
  console.error("A02 is not deployed. Apply database/migrations/002_uc_a02_products_inventory.sql with an approved migration identity.");
  process.exitCode = 1;
} else {
  console.log("A02 public schema/RLS checks passed; authenticated RBAC/RPC tests remain required.");
}

function detail(text) {
  try {
    const value = JSON.parse(text);
    return value.message || value.hint || value.code || "request failed";
  } catch {
    return String(text || "request failed").slice(0, 200);
  }
}
