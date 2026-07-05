const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check chat sessions
  const sessions = await client.query(`
    SELECT session_id, title, handoff_status, last_message_preview, created_at 
    FROM chat_session ORDER BY created_at DESC LIMIT 5
  `);
  console.log('Chat sessions:', sessions.rows.length);
  sessions.rows.forEach(r => console.log(`  ${r.title} | ${r.handoff_status} | ${r.created_at}`));

  // Check chat messages
  const messages = await client.query(`
    SELECT sender, text, product_ids, created_at 
    FROM chat_message ORDER BY created_at DESC LIMIT 10
  `);
  console.log('\nChat messages:', messages.rows.length);
  messages.rows.forEach(r => {
    const text = r.text ? r.text.substring(0, 80) : '';
    const prods = r.product_ids ? r.product_ids.length : 0;
    console.log(`  [${r.sender}] ${text}... (${prods} products)`);
  });

  // Check email outbox
  const emails = await client.query(`SELECT COUNT(*) as count FROM email_outbox`);
  console.log('\nEmail outbox:', emails.rows[0].count, 'queued');

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
