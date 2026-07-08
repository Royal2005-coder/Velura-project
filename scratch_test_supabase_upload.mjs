import fs from 'fs';

async function testUpload() {
  try {
    const fileBuffer = Buffer.from("fake image content to simulate image file");
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    
    // Construct multipart form data body manually
    const bodyParts = [
      `--${boundary}\r\n`,
      `Content-Disposition: form-data; name="file"; filename="test_upload.png"\r\n`,
      `Content-Type: image/png\r\n\r\n`,
      fileBuffer,
      `\r\n--${boundary}--\r\n`
    ];
    
    // We need to concat buffers and strings
    const buffers = bodyParts.map(part => typeof part === 'string' ? Buffer.from(part) : part);
    const body = Buffer.concat(buffers);
    
    const res = await fetch("http://localhost:8787/api/user/upload/evidence", {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`
      },
      body
    });
    
    console.log("Upload Status:", res.status);
    const json = await res.json();
    console.log("Upload Response:", json);
    
    if (json.success && json.url) {
      console.log("Fetching uploaded URL: ", json.url);
      const getRes = await fetch(json.url);
      console.log("Fetch Status:", getRes.status);
      const text = await getRes.text();
      console.log("Fetch content (first 200 chars):", text.slice(0, 200));
    }
  } catch (err) {
    console.error("Upload Error:", err);
  }
}

testUpload();
