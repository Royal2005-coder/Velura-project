import fs from 'fs';

// Load env
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const BASE = "http://localhost:8787";

async function apiReq(path, token, opts = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  return res.json();
}

async function uploadImage(token) {
  // Create a minimal valid PNG (1x1 pixel, 67 bytes)
  const minPng = Buffer.from([
    0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A, // PNG signature
    0x00,0x00,0x00,0x0D,0x49,0x48,0x44,0x52, // IHDR chunk
    0x00,0x00,0x00,0x01,0x00,0x00,0x00,0x01, // 1x1
    0x08,0x02,0x00,0x00,0x00,0x90,0x77,0x53, // 8-bit RGB
    0xDE,0x00,0x00,0x00,0x0C,0x49,0x44,0x41, // IDAT chunk
    0x54,0x08,0xD7,0x63,0xF8,0xCF,0xC0,0x00, // compressed pixel data
    0x00,0x00,0x02,0x00,0x01,0xE2,0x21,0xBC, // 
    0x33,0x00,0x00,0x00,0x00,0x49,0x45,0x4E, // IEND chunk
    0x44,0xAE,0x42,0x60,0x82              // end
  ]);
  
  const boundary = "----TestBoundary123";
  const bodyParts = [
    `--${boundary}\r\n`,
    `Content-Disposition: form-data; name="file"; filename="test-review-img.png"\r\n`,
    `Content-Type: image/png\r\n\r\n`,
    minPng,
    `\r\n--${boundary}--\r\n`
  ];
  const body = Buffer.concat(bodyParts.map(p => typeof p === 'string' ? Buffer.from(p) : p));
  
  const headers = { "Content-Type": `multipart/form-data; boundary=${boundary}` };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`${BASE}/api/user/upload/evidence`, { method: "POST", headers, body });
  return res.json();
}

async function run() {
  // Sign in as Trần Diễm Quỳnh (lan@email.com)
  console.log("1. Signing in...");
  const signinRes = await apiReq("/api/user/auth/signin", null, {
    method: "POST",
    body: { identity: "lan@email.com", password: "Velura@2025" }
  });
  
  if (!signinRes.token) {
    console.log("Signin failed:", signinRes);
    // Try phone
    const signinByPhone = await apiReq("/api/user/auth/signin", null, {
      method: "POST",
      body: { identity: "0855808330", password: "Velura@2025" }
    });
    console.log("Phone signin:", signinByPhone);
    return;
  }
  
  const token = signinRes.token;
  console.log("   Token obtained:", token.slice(0, 30) + "...");

  // Upload image
  console.log("\n2. Uploading a real PNG image...");
  const uploadResult = await uploadImage(token);
  console.log("   Upload result:", uploadResult);
  
  if (!uploadResult.url) {
    console.log("   Upload failed!");
    return;
  }
  
  const imageUrl = uploadResult.url;
  console.log("   Image URL:", imageUrl);
  
  // Verify URL is accessible
  const verifyRes = await fetch(imageUrl);
  console.log("   URL verify status:", verifyRes.status);
}

run().catch(console.error);
