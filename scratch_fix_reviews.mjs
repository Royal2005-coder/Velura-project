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
    // Step 1: Create the return-evidence bucket as public
    console.log("1. Creating bucket 'return-evidence'...");
    const createBucketRes = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: "POST",
      headers: { 
        'apikey': key, 
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: "return-evidence",
        name: "return-evidence",
        public: true,
        allowed_mime_types: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        file_size_limit: 5242880 // 5 MB
      })
    });
    const createResult = await createBucketRes.json();
    console.log("   Create bucket result:", createResult);

    // Step 2: Fix bad image data in review table
    // Find reviews where images contains non-URL values (not starting with http)
    console.log("\n2. Fetching all reviews to fix bad images...");
    const reviewsRes = await fetch(`${supabaseUrl}/rest/v1/review?select=review_id,images,product_id&images=neq.{}`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const reviews = await reviewsRes.json();
    
    let fixedCount = 0;
    for (const review of reviews) {
      if (!Array.isArray(review.images)) continue;
      const validImages = review.images.filter(img => typeof img === 'string' && img.startsWith('http'));
      if (validImages.length !== review.images.length) {
        console.log(`   Fixing review ${review.review_id}: ${review.images.length} images -> ${validImages.length} valid`);
        console.log(`   Removed: ${review.images.filter(img => !img.startsWith('http'))}`);
        
        const patchRes = await fetch(`${supabaseUrl}/rest/v1/review?review_id=eq.${review.review_id}`, {
          method: "PATCH",
          headers: { 
            'apikey': key, 
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ images: validImages })
        });
        console.log(`   Patch status: ${patchRes.status}`);
        fixedCount++;
      }
    }
    console.log(`\n   Fixed ${fixedCount} reviews with bad image URLs.`);

  } catch (err) {
    console.error('Error:', err);
  }
}

run();
