/**
 * Restore Combo Items — restores original component products to existing combos (is_combo = true products)
 * using the correct definitions from database/database_user/seed_data.sql.
 *
 * Usage: node --env-file=.env database/seed/restore-combo-items.mjs
 */

import fs from "fs";

const SUPABASE_URL = process.env.VELURA_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VELURA_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or key in .env");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  authorization: `Bearer ${SERVICE_KEY}`,
  "content-type": "application/json",
  prefer: "return=representation"
};

async function sbGet(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function sbPost(table, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { ...headers, prefer: "return=representation" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function sbDelete(table, query = "") {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers
  });
  if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status} ${await res.text()}`);
  console.log(`🗑 Deleted from ${table} with query "${query}"`);
}

async function main() {
  console.log("📖 Parsing seed_data.sql for combo mappings...");
  const content = fs.readFileSync("database/database_user/seed_data.sql", "utf8");
  const blocks = content.split("INSERT INTO combo_item");
  console.log(`Found ${blocks.length - 1} INSERT INTO combo_item blocks in SQL file`);

  const parsed = [];
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const comboSkuMatch = block.match(/WHERE sku = '(VLR-SD-\d+)'/);
    if (!comboSkuMatch) continue;
    const comboSku = comboSkuMatch[1];

    const componentSkuMatches = [...block.matchAll(/WHERE sku = '(VLR-[A-Z]+-\d+)'/g)];
    if (componentSkuMatches.length < 2) continue;
    const componentSku = componentSkuMatches[1][1];

    const colorMatch = block.match(/color = '([^']+)'/);
    const sizeMatch = block.match(/size = '([^']+)'/);
    const color = colorMatch ? colorMatch[1] : null;
    const size = sizeMatch ? sizeMatch[1] : null;

    const qtyMatch = block.match(/,\s*(\d+)\s*\n\s*\);/);
    const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    parsed.push({ comboSku, componentSku, color, size, quantity });
  }
  console.log(`Parsed ${parsed.length} items from SQL file successfully.`);

  console.log("🔍 Loading existing products and variants from database...");
  const products = await sbGet("product", "select=product_id,sku,name");
  const variants = await sbGet("variant", "select=variant_id,product_id,color,size");

  console.log(`Fetched ${products.length} products and ${variants.length} variants.`);

  // Maps for fast lookup
  const productBySku = new Map(products.map(p => [p.sku, p]));
  const variantMap = new Map();
  for (const v of variants) {
    const key = `${v.product_id}|${v.color}|${v.size}`;
    variantMap.set(key, v.variant_id);
  }

  // Delete all existing combo items
  console.log("🧹 Clearing existing combo items...");
  await sbDelete("combo_item", "quantity=not.is.null");

  // Map parsed items to database objects
  const newItems = [];
  let skipped = 0;
  for (const item of parsed) {
    const combo = productBySku.get(item.comboSku);
    const component = productBySku.get(item.componentSku);

    if (!combo) {
      console.warn(`Warning: Combo product SKU "${item.comboSku}" not found in DB`);
      skipped++;
      continue;
    }
    if (!component) {
      console.warn(`Warning: Component product SKU "${item.componentSku}" not found in DB`);
      skipped++;
      continue;
    }

    let variantId = null;
    if (item.color && item.size) {
      const key = `${component.product_id}|${item.color}|${item.size}`;
      variantId = variantMap.get(key) || null;
      if (!variantId) {
        console.warn(`Warning: Variant not found for SKU ${item.componentSku} (${item.color}, ${item.size})`);
      }
    }

    newItems.push({
      combo_product_id: combo.product_id,
      component_product_id: component.product_id,
      component_variant_id: variantId,
      quantity: item.quantity
    });
  }

  console.log(`Inserting ${newItems.length} correct combo items (${skipped} skipped)...`);

  // Insert in chunks of 100 to be safe and avoid payload limit
  const chunkSize = 100;
  for (let i = 0; i < newItems.length; i += chunkSize) {
    const chunk = newItems.slice(i, i + chunkSize);
    await sbPost("combo_item", chunk);
    console.log(`  -> Inserted batch ${i / chunkSize + 1} (${chunk.length} items)`);
  }

  console.log("🎉 Combo items successfully restored!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
