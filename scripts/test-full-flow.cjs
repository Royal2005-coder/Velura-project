const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({ hostname: '127.0.0.1', port: 8787, path, method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch(e) { resolve({ raw: buf }); } });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => { req.destroy(); reject(new Error('timeout')); });
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 8787, path }, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch(e) { resolve({ raw: buf }); } });
    }).on('error', reject);
  });
}

async function main() {
  const guestId = '550e8400-e29b-41d4-a716-446655440000';

  // Test 1: Normal chat
  console.log('=== Test 1: Normal chat ===');
  try {
    const r1 = await post('/api/v1/chat/messages', { guestId, mode: 'guest', message: 'gợi ý váy dự tiệc' });
    console.log('Session:', r1.session?.session_id);
    console.log('N8N used:', r1.session?.metadata?.n8n_used);
    console.log('Products:', r1.products?.length || 0);
    console.log('Bot:', (r1.messages?.[1]?.text || '').substring(0, 100));
  } catch(e) { console.log('Error:', e.message); }

  // Test 2: Handoff with "nhân viên"
  console.log('\n=== Test 2: Handoff ===');
  try {
    const r2 = await post('/api/v1/chat/messages', { guestId, mode: 'guest', message: 'tôi muốn nói chuyện với nhân viên tư vấn', guestEmail: 'test@velura.vn', guestPhone: '0901234567' });
    console.log('Session:', r2.session?.session_id);
    console.log('Handoff:', JSON.stringify(r2.handoff));
    console.log('Status:', r2.session?.handoff_status);
    console.log('Ticket:', r2.session?.support_ticket_id);
    console.log('Bot:', (r2.messages?.[1]?.text || '').substring(0, 150));
  } catch(e) { console.log('Error:', e.message); }

  // Test 3: Check email outbox
  console.log('\n=== Test 3: Email outbox ===');
  try {
    const r3 = await get('/api/v1/admin/chat-sessions?limit=5');
    console.log('Admin sessions:', r3.rows?.length || 0);
    r3.rows?.slice(0, 3).forEach(s => console.log('  -', s.title, '|', s.handoff_status));
  } catch(e) { console.log('Error:', e.message); }
}

main().catch(console.error);
