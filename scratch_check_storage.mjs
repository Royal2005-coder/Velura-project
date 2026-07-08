import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const supabaseUrl = env.VELURA_SUPABASE_URL;
const key = env.VELURA_SUPABASE_ANON_KEY;

async function run() {
  try {
    const listRes = await fetch(`${supabaseUrl}/storage/v1/object/list/return-evidence/evidence`, {
      method: "POST",
      headers: { 
        'apikey': key, 
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: "",
        limit: 100,
        offset: 0,
        sort_by: { column: "name", order: "asc" }
      })
    });
    const files = await listRes.json();
    console.log("Files in return-evidence/evidence:", JSON.stringify(files, null, 2));
    
    // Also test: can we access the review with a filename-only image?
    const badUrl = "DALL·E 2025-02-09 16.46.14 - A top-down 2D dungeon maze for a Scratch game, featuring dark stone pathways with glowing red fire walls as obstacles. The player's character, a small.webp";
    const testUrl = `${supabaseUrl}/storage/v1/object/public/return-evidence/${badUrl}`;
    console.log("\nTesting bad URL access:", testUrl);
    try {
      const r = await fetch(testUrl);
      console.log("Bad URL fetch status:", r.status);
    } catch(e) {
      console.log("Bad URL fetch failed:", e.message);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
