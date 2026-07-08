import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '');
  }
});

const supabaseUrl = env.VELURA_SUPABASE_URL;
const key = env.VELURA_SUPABASE_ANON_KEY;

async function fetchOne(table) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  return data[0];
}

async function run() {
  try {
    const product = await fetchOne('product');
    const user = await fetchOne('users');
    const order = await fetchOne('orders');

    const headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    // A URL with length 260 characters
    const longUrl = 'https://placehold.co/600x400/7d562d/ffffff/png?text=' + 'A'.repeat(210);
    console.log('URL Length:', longUrl.length);

    const reviewPayload = {
      product_id: product.product_id,
      user_id: user.user_id,
      order_id: order.order_id,
      rating: 5,
      comment: 'Test comment with long url',
      images: [longUrl],
      review_tags: ['Đẹp'],
      status: 'pending'
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/review`, {
      method: 'POST',
      headers,
      body: JSON.stringify(reviewPayload)
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
