import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

loadEnv();

const supabaseUrl = stripTrailingSlash(process.env.VELURA_SUPABASE_URL || "");
const serviceKey = process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  console.error("Missing VELURA_SUPABASE_URL or VELURA_SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const roles = [
  { code: "super_admin", name: "Admin quan tri", description: "Full system administration", is_admin: true, sort_order: 1 },
  { code: "product_admin", name: "Admin quan ly san pham", description: "Catalog and inventory administration", is_admin: true, sort_order: 10 },
  { code: "order_admin", name: "Admin quan ly don hang", description: "Order and payment operations", is_admin: true, sort_order: 20 },
  { code: "pricing_admin", name: "Admin quan ly gia va khuyen mai", description: "Pricing, vouchers and campaigns", is_admin: true, sort_order: 30 },
  { code: "review_admin", name: "Admin quan ly danh gia", description: "Review moderation and escalation", is_admin: true, sort_order: 40 },
  { code: "service_admin", name: "Admin doi tra va CSKH", description: "Return and support operations", is_admin: true, sort_order: 50 },
  { code: "read_only_admin", name: "Admin chi xem", description: "Read-only reporting and logs", is_admin: true, sort_order: 90 },
  { code: "member", name: "Member", description: "Customer account", is_admin: false, sort_order: 100 }
];

await upsert("app_roles", roles, "code");
const roleRows = await getRows("app_roles", "id,code");
const roleId = Object.fromEntries(roleRows.map((role) => [role.code, role.id]));

const profiles = [
  { email: "admin@velura.vn", phone: "0923456789", full_name: "Pham Thu Huong", role_id: roleId.super_admin, status: "active", customer_tier: "staff" },
  { email: "product@velura.vn", phone: "0912345678", full_name: "Tran Minh Tuan", role_id: roleId.product_admin, status: "active", customer_tier: "staff" },
  { email: "order@velura.vn", phone: "0934567890", full_name: "Le Gia Linh", role_id: roleId.order_admin, status: "active", customer_tier: "staff" },
  { email: "price@velura.vn", phone: "0956789012", full_name: "Ngo Thanh Son", role_id: roleId.pricing_admin, status: "active", customer_tier: "staff" },
  { email: "cskh@velura.vn", phone: "0967890123", full_name: "Vu Thanh Mai", role_id: roleId.service_admin, status: "active", customer_tier: "staff" }
];

await upsert("profiles", profiles, "email");
console.log(`Seeded ${roles.length} roles and ${profiles.length} admin profiles.`);

async function upsert(table, rows, onConflict) {
  if (!rows.length) return [];
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?on_conflict=${onConflict}`, {
    method: "POST",
    headers: headers({
      prefer: "resolution=merge-duplicates,return=representation"
    }),
    body: JSON.stringify(rows)
  });
  return parseResponse(response);
}

async function getRows(table, select) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=${encodeURIComponent(select)}`, {
    headers: headers()
  });
  return parseResponse(response);
}

async function parseResponse(response) {
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    console.error(data);
    throw new Error(`Supabase ${response.status}`);
  }
  return data;
}

function headers(extra = {}) {
  return {
    apikey: serviceKey,
    authorization: `Bearer ${serviceKey}`,
    "content-type": "application/json",
    accept: "application/json",
    ...extra
  };
}

function loadEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!process.env[key]) {
      process.env[key] = rest.join("=").replace(/^["']|["']$/g, "");
    }
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}
