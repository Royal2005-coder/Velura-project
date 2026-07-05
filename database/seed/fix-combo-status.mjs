import fs from "fs";

const SUPABASE_URL = "https://drvkrpoojyncodfytftn.supabase.co";

let SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!SERVICE_KEY) {
  try {
    const env = fs.readFileSync(new URL("../../.env", import.meta.url), "utf8");
    const match = env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
    if (match) SERVICE_KEY = match[1].trim();
  } catch {}
}

if (!SERVICE_KEY) {
  console.error("Error: Supabase Service Role Key not found in .env!");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  authorization: `Bearer ${SERVICE_KEY}`,
  accept: "application/json",
  "content-type": "application/json"
};

async function run() {
  console.log("Fetching products and combo items...");
  
  // 1. Fetch all products
  const productsRes = await fetch(`${SUPABASE_URL}/rest/v1/product?select=product_id,sku,name,is_combo`, { headers });
  if (!productsRes.ok) {
    console.error("Failed to fetch products:", await productsRes.text());
    process.exit(1);
  }
  const products = await productsRes.json();

  // 2. Fetch all combo items
  const combosRes = await fetch(`${SUPABASE_URL}/rest/v1/combo_item?select=combo_product_id`, { headers });
  if (!combosRes.ok) {
    console.error("Failed to fetch combo items:", await combosRes.text());
    process.exit(1);
  }
  const comboItems = await combosRes.json();
  const comboProductIds = new Set(comboItems.map(item => item.combo_product_id));

  console.log(`Loaded ${products.length} products and ${comboProductIds.size} unique combos.`);

  // 3. Find and update mismatched products
  let updatedCount = 0;
  for (const product of products) {
    const isActuallyCombo = comboProductIds.has(product.product_id);
    if (product.is_combo && !isActuallyCombo) {
      console.log(`Product ${product.sku} ("${product.name}") is marked as combo but has no combo components. Fixing to false...`);
      const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/product?product_id=eq.${product.product_id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_combo: false })
      });
      if (!updateRes.ok) {
        console.error(`Failed to update product ${product.sku}:`, await updateRes.text());
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully fixed ${updatedCount} products.`);
}

run().catch(console.error);
