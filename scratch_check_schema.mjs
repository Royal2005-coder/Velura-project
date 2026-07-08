import { selectRows } from "./apps/api/src/supabase.js";

async function check() {
  const { rows } = await selectRows("product", { limit: 100 }, { useAnonKey: true });
  console.log("Total products fetched:", rows.length);
  
  const allStyleTags = new Set();
  const allBodyShapes = new Set();
  
  rows.forEach(p => {
    if (p.style_tags) {
      const tags = Array.isArray(p.style_tags) ? p.style_tags : JSON.parse(p.style_tags);
      tags.forEach(t => allStyleTags.add(t));
    }
    if (p.suitable_body_shapes) {
      const shapes = Array.isArray(p.suitable_body_shapes) ? p.suitable_body_shapes : JSON.parse(p.suitable_body_shapes);
      shapes.forEach(s => allBodyShapes.add(s));
    }
  });
  
  console.log("Unique Style Tags in DB:", Array.from(allStyleTags));
  console.log("Unique Body Shapes in DB:", Array.from(allBodyShapes));
}

check().catch(console.error);
