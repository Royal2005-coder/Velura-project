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
    const res = await fetch(`${supabaseUrl}/rest/v1/product?product_id=eq.fc8618c1-1c5c-4ed4-a59d-7e46c0f2a90c`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    console.log("Product:", data);

    const userRes = await fetch(`${supabaseUrl}/rest/v1/users?user_id=eq.5da4d5c4-d5de-48c9-96c7-eddbc0e82eff`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const userData = await userRes.json();
    console.log("User:", userData);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
