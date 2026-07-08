import { buildProductEmbeddingText } from "../apps/api/src/recommendation-service.js";
import { generateGeminiEmbedding, vectorLiteral } from "../apps/api/src/gemini-client.js";
import { selectRows, updateRows } from "../apps/api/src/supabase.js";

const PRODUCT_SELECT = [
  "product_id",
  "sku",
  "is_combo",
  "name",
  "slug",
  "description",
  "category_id",
  "brand",
  "base_price",
  "sale_price",
  "images",
  "style_tags",
  "color_tone",
  "occasions",
  "suitable_body_shapes",
  "status",
  "is_featured",
  "collection",
  "embedding_updated_at",
  "category:category(category_id,name,slug)",
  "variants:variant(variant_id,color,color_hex,size,stock_quantity,reserved_quantity)"
].join(",");

const force = process.argv.includes("--force");
const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 500;

const { rows } = await selectRows("product", {
  select: PRODUCT_SELECT,
  status: "eq.on_sale",
  is_combo: "eq.false",
  order: "updated_at.desc",
  limit: Number.isFinite(limit) && limit > 0 ? limit : 500
}, { useAnonKey: true });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let updated = 0;
let skipped = 0;

for (const product of rows) {
  if (!force && product.embedding_updated_at) {
    skipped += 1;
    continue;
  }

  const text = await buildProductEmbeddingText(product);
  
  let embedding = null;
  let retries = 5;
  
  while (retries > 0) {
    try {
      embedding = await generateGeminiEmbedding(`title: ${product.name || "Sản phẩm"} | text: ${text}`);
      break;
    } catch (err) {
      if (err.status === 429) {
        console.warn(`[rate-limit] Exceeded quota for product ${product.sku || product.product_id}. Retrying in 8 seconds...`);
        await sleep(8000);
        retries--;
      } else {
        throw err;
      }
    }
  }

  if (!embedding) {
    console.error(`[error] Could not generate embedding for product ${product.sku || product.product_id} after retries.`);
    continue;
  }

  await updateRows("product", { product_id: `eq.${product.product_id}` }, {
    embedding: vectorLiteral(embedding),
    embedding_updated_at: new Date().toISOString()
  }, { useAnonKey: true });

  updated += 1;
  console.log(`[embedding] ${updated}/${rows.length} ${product.sku || product.product_id} ${product.name}`);
  
  // Minor throttle delay to prevent rapid burst 429 rate limit
  await sleep(1000);
}

console.log(JSON.stringify({ updated, skipped, total: rows.length }, null, 2));
