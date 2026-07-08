const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 8787, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        console.log('HTTP', res.statusCode);
        try { resolve(JSON.parse(buf)); } catch(e) { resolve({ raw: buf.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

async function main() {
  const guestId = '550e8400-e29b-41d4-a716-446655440000';

  // Message 1: create session
  console.log('=== Message 1 ===');
  const r1 = await post('/api/v1/chat/messages', { guestId, mode: 'guest', message: 'xin chào' });
  console.log('Session:', r1.session?.session_id);
  console.log('N8N:', r1.session?.metadata?.n8n_used);
  console.log('Products:', r1.products?.length);
  if (r1.error) console.log('Error:', r1.error);
  if (r1.raw) console.log('Raw:', r1.raw);

  // Message 2: use same session
  console.log('\n=== Message 2 (same session) ===');
  const r2 = await post('/api/v1/chat/messages', { guestId, mode: 'guest', message: 'outfit đi biển', sessionId: r1.session?.session_id });
  console.log('Session:', r2.session?.session_id);
  console.log('N8N:', r2.session?.metadata?.n8n_used);
  console.log('Products:', r2.products?.length);
  if (r2.error) console.log('Error:', r2.error);
  if (r2.raw) console.log('Raw:', r2.raw);

  // Message 3: different topic
  console.log('\n=== Message 3 ===');
  const r3 = await post('/api/v1/chat/messages', { guestId, mode: 'guest', message: 'gợi ý áo blazer', sessionId: r1.session?.session_id });
  console.log('Session:', r3.session?.session_id);
  console.log('N8N:', r3.session?.metadata?.n8n_used);
  console.log('Products:', r3.products?.length);
  if (r3.error) console.log('Error:', r3.error);
}

main().catch(console.error);
