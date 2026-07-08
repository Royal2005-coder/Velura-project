const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const r = await client.query(`SELECT e.enumlabel FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'ai_log_type'`);
  console.log('ai_log_type values:', r.rows.map(x => x.enumlabel).join(', '));
  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
