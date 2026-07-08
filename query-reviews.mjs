import { selectRows } from "./apps/api/src/supabase.js";
import { assertRuntimeConfig } from "./apps/api/src/config.js";

assertRuntimeConfig();

async function run() {
  const { rows: products } = await selectRows("product", { limit: 5 });
  for (const p of products) {
    const { rows: variants } = await selectRows("variant", { product_id: `eq.${p.product_id}` });
    console.log(`Product: ${p.name} (Base Price: ${p.base_price}, Sale Price: ${p.sale_price})`);
    for (const v of variants) {
      console.log(`  Variant: ${v.color} - Size ${v.size} (ID: ${v.variant_id})`);
    }
  }
}

run().catch(console.error);
