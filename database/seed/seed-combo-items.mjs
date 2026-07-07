/**
 * Seed Combo Items — adds component products to existing combos (is_combo = true products)
 *
 * Prerequisites:
 *   1. Run migration 010_combo_item_table.sql in Supabase SQL Editor
 *   2. Products with is_combo = true must already exist
 *   3. Component products (is_combo = false) must already exist
 *
 * Usage: node --env-file=.env database/seed/seed-combo-items.mjs
 */

const SUPABASE_URL = process.env.VELURA_SUPABASE_URL || process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY  = process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
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
    headers: { ...headers, prefer: "return=representation,resolution=merge-duplicates" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`POST ${table} failed: ${res.status} ${body}`);
  }
  return res.json();
}

async function main() {
  console.log("🔍 Loading products from Supabase...");

  // Get all products
  const allProducts = await sbGet("product", "select=product_id,sku,name,is_combo,base_price,sale_price,status&order=created_at.asc");
  const combos = allProducts.filter(p => p.is_combo === true);
  const singles = allProducts.filter(p => p.is_combo !== true && p.status === "on_sale");

  console.log(`📦 Found ${allProducts.length} products total`);
  console.log(`🎁 Found ${combos.length} combos (is_combo = true)`);
  console.log(`👔 Found ${singles.length} single products available as components`);

  if (!combos.length) {
    console.log("⚠ No combo products found. Creating sample combos from existing products...");
    
    // Create sample combo products from categories of existing products
    if (singles.length >= 4) {
      const sampleCombos = [
        {
          sku: "VLR-CB-001",
          name: "Combo Outfit Thanh Lịch",
          slug: "combo-outfit-thanh-lich",
          description: "Bộ outfit thanh lịch gồm áo, quần và phụ kiện phối hợp hoàn hảo",
          category_id: singles[0].category_id || null,
          base_price: 2990000,
          sale_price: 2490000,
          is_combo: true,
          is_featured: true,
          status: "on_sale",
          images: []
        },
        {
          sku: "VLR-CB-002",
          name: "Combo Dạo Phố Cuối Tuần",
          slug: "combo-dao-pho-cuoi-tuan",
          description: "Set đồ dạo phố phong cách trẻ trung, năng động",
          category_id: singles[0].category_id || null,
          base_price: 1890000,
          sale_price: 1490000,
          is_combo: true,
          is_featured: false,
          status: "on_sale",
          images: []
        },
        {
          sku: "VLR-CB-003",
          name: "Combo Công Sở Chuyên Nghiệp",
          slug: "combo-cong-so-chuyen-nghiep",
          description: "Bộ trang phục công sở tối giản, sang trọng",
          category_id: singles[0].category_id || null,
          base_price: 3590000,
          sale_price: 2990000,
          is_combo: true,
          is_featured: true,
          status: "on_sale",
          images: []
        }
      ];

      // Get categories
      const categories = await sbGet("category", "select=category_id,slug&limit=10");
      const setDoCategory = categories.find(c => c.slug === "set-do") || categories[0];
      
      for (const combo of sampleCombos) {
        combo.category_id = setDoCategory?.category_id || combo.category_id;
      }

      console.log("📝 Creating sample combo products...");
      try {
        const created = await sbPost("product", sampleCombos);
        console.log(`✅ Created ${created.length} combo products`);
        combos.push(...created);
      } catch (err) {
        console.log("⚠ Could not create combos (may already exist):", err.message);
        // Try to fetch them if they exist
        const existing = await sbGet("product", "select=product_id,sku,name,is_combo,base_price,sale_price&is_combo=eq.true");
        combos.length = 0;
        combos.push(...existing);
      }
    }
  }

  if (!combos.length || singles.length < 2) {
    console.log("❌ Not enough products to create combo items. Need at least 1 combo and 2 single products.");
    process.exit(0);
  }

  // Check existing combo_items
  let existingItems = [];
  try {
    existingItems = await sbGet("combo_item", "select=combo_item_id,combo_product_id,component_product_id");
    console.log(`📋 Found ${existingItems.length} existing combo items`);
  } catch (err) {
    console.log("⚠ combo_item table may not exist yet:", err.message);
    console.log("👉 Run migration 010_combo_item_table.sql first!");
    process.exit(1);
  }

  // Build combo items: assign 2-4 random single products to each combo
  const newItems = [];
  for (const combo of combos) {
    const existing = existingItems.filter(i => i.combo_product_id === combo.product_id);
    if (existing.length > 0) {
      console.log(`⏭ Combo "${combo.name}" already has ${existing.length} items, skipping`);
      continue;
    }

    // Pick 2-4 random unique singles
    const count = Math.min(2 + Math.floor(Math.random() * 3), singles.length);
    const shuffled = [...singles].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, count);

    for (const component of chosen) {
      newItems.push({
        combo_product_id: combo.product_id,
        component_product_id: component.product_id,
        component_variant_id: null,
        quantity: 1
      });
    }
    console.log(`🎁 Combo "${combo.name}" → ${chosen.map(c => c.sku).join(", ")}`);
  }

  if (!newItems.length) {
    console.log("✅ All combos already have items. Nothing to seed.");
    process.exit(0);
  }

  console.log(`\n📝 Inserting ${newItems.length} combo items...`);
  try {
    const inserted = await sbPost("combo_item", newItems);
    console.log(`✅ Successfully inserted ${inserted.length} combo items!`);
  } catch (err) {
    console.error("❌ Failed to insert combo items:", err.message);
    process.exit(1);
  }

  // Verify
  const finalItems = await sbGet("combo_item", "select=combo_item_id,combo_product_id,component_product_id,quantity");
  console.log(`\n📊 Final state: ${finalItems.length} combo items across ${combos.length} combos`);
  
  for (const combo of combos) {
    const items = finalItems.filter(i => i.combo_product_id === combo.product_id);
    console.log(`   🎁 ${combo.name} (${combo.sku}): ${items.length} components`);
  }

  console.log("\n🎉 Combo seeding complete!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
