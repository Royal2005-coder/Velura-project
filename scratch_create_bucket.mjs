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
const serviceKey = env.VELURA_SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error("VELURA_SUPABASE_SERVICE_ROLE_KEY is not set in .env!");
  process.exit(1);
}

async function run() {
  try {
    // Step 1: Create the return-evidence bucket as public using service role key
    console.log("1. Creating bucket 'return-evidence' with service role key...");
    const createBucketRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: { 
        'apikey': serviceKey, 
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: "return-evidence",
        name: "return-evidence",
        public: true,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        file_size_limit: 5242880
      })
    });
    const createResult = await createBucketRes.json();
    console.log("   Result:", createResult);

    // Step 2: List all buckets
    console.log("\n2. Listing all buckets...");
    const bucketsRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { 
        'apikey': serviceKey, 
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    const buckets = await bucketsRes.json();
    console.log("   Buckets:", buckets);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
