const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const r = await client.query(`SELECT last_error, attempts FROM email_outbox WHERE status = 'failed' ORDER BY created_at DESC LIMIT 3`);
  console.log('Email errors:');
  r.rows.forEach(row => console.log(`  Error: ${row.last_error} | Attempts: ${row.attempts}`));
  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
