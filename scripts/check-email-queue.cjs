const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  const emails = await client.query(`
    SELECT email_id, recipient, subject, status, template_code, body, created_at 
    FROM email_outbox ORDER BY created_at DESC LIMIT 5
  `);
  console.log('Email outbox (latest 5):');
  emails.rows.forEach(r => {
    console.log(`  ${r.template_code} | ${r.recipient} | ${r.status}`);
    console.log(`    Subject: ${r.subject}`);
    console.log(`    Body: ${(r.body || '').substring(0, 150)}`);
    console.log(`    Created: ${r.created_at}`);
  });

  const pending = await client.query(`SELECT COUNT(*) as c FROM email_outbox WHERE status = 'pending'`);
  const sent = await client.query(`SELECT COUNT(*) as c FROM email_outbox WHERE status = 'sent'`);
  const failed = await client.query(`SELECT COUNT(*) as c FROM email_outbox WHERE status = 'failed'`);
  console.log(`\nPending: ${pending.rows[0].c} | Sent: ${sent.rows[0].c} | Failed: ${failed.rows[0].c}`);

  const tickets = await client.query(`SELECT ticket_id, title, status, guest_email FROM support_ticket ORDER BY created_at DESC LIMIT 3`);
  console.log('\nLatest tickets:');
  tickets.rows.forEach(r => console.log(`  ${r.title} | ${r.status} | ${r.guest_email}`));

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
