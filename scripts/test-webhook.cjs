const https = require('https');

const data = JSON.stringify({
  message: "xin chào",
  session_id: "test-002",
  guest_id: "guest-test-002",
  user_id: null
});

const options = {
  hostname: 'gianth.app.n8n.cloud',
  path: '/webhook/ai-ecommerce-customer-support',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  },
  timeout: 60000
};

console.log('Sending request...');
const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', JSON.stringify(res.headers));
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Body length:', body.length);
    console.log('Body:', body.substring(0, 2000));
  });
});
req.on('error', (e) => console.error('Error:', e.message));
req.on('timeout', () => { console.log('Timeout!'); req.destroy(); });
req.write(data);
req.end();
