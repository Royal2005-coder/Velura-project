import fs from "fs";
import { FALLBACK_BLOG_POSTS } from "../../apps/user-web/src/scripts/modules/blog-posts.js";

let supabaseUrl = process.env.VELURA_SUPABASE_URL || process.env.SUPABASE_URL || "";
let serviceKey = process.env.VELURA_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  try {
    const env = fs.readFileSync(new URL("../../.env", import.meta.url), "utf8");
    supabaseUrl ||= env.match(/(?:VELURA_SUPABASE_URL|SUPABASE_URL)=(.*)/)?.[1]?.trim() || "";
    serviceKey = env.match(/VELURA_SUPABASE_SERVICE_ROLE_KEY=(.*)/)?.[1]?.trim() || "";
  } catch {}
}

if (!supabaseUrl || !serviceKey) {
  throw new Error("Missing Supabase URL or service role key. Update .env before running this script.");
}

const slugs = new Set([
  "bang-mau-mua-thu-2026",
  "dich-le-nhiet-ba-phan-huy",
  "he-mong-dao-dam-viet",
  "ba-thuong-hieu-viet-london-fw-2026",
  "quiet-luxury-phai-dep-viet",
  "cach-phoi-blazer-linen-mua-he",
  "hanh-trinh-vay-linen-xuong-velura",
  "a-khoi-thanh-huong-ao-dai-co-yem",
  "cong-thuc-phoi-do-resort-he-2026",
  "dang-my-linh-thoi-trang-nhat-ky"
]);
const posts = FALLBACK_BLOG_POSTS.filter((post) => slugs.has(post.slug));

for (const post of posts) {
  const response = await fetch(`${supabaseUrl}/rest/v1/blog?slug=eq.${encodeURIComponent(post.slug)}`, {
    method: "PATCH",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      prefer: "return=representation"
    },
    body: JSON.stringify({
      category_slug: post.category_slug,
      title: post.title,
      excerpt: post.excerpt,
      image_url: post.image_url,
      author: post.author,
      read_minutes: post.read_minutes,
      content: post.content
    })
  });
  const rows = await response.json();
  if (!response.ok) throw new Error(`${post.slug}: ${JSON.stringify(rows)}`);
  if (!rows.length) throw new Error(`${post.slug}: no matching blog row found`);
  console.log(`Updated ${post.slug}`);
}
