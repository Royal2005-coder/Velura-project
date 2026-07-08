const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check latest email outbox entries
  const emails = await client.query(`
    SELECT email_id, recipient, subject, status, template_code, created_at 
    FROM email_outbox ORDER BY created_at DESC LIMIT 5
  `);
  console.log('Latest email outbox entries:', emails.rows.length);
  emails.rows.forEach(r => console.log(`  ${r.template_code} | ${r.recipient} | ${r.status} | ${r.subject}`));

  // Check support tickets
  const tickets = await client.query(`
    SELECT ticket_id, title, status, priority, guest_email, created_at 
    FROM support_ticket ORDER BY created_at DESC LIMIT 5
  `);
  console.log('\nSupport tickets:', tickets.rows.length);
  tickets.rows.forEach(r => console.log(`  ${r.ticket_id.toString().substring(0,8)} | ${r.title} | ${r.status} | ${r.priority}`));

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
