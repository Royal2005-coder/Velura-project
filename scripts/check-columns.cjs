const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const tables = ['category', 'support_ticket', 'ai_log', 'blog', 'policy', 'static_page'];
  for (const t of tables) {
    const r = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${t}' ORDER BY ordinal_position`);
    console.log(`\n--- ${t} ---`);
    console.log(r.rows.map(x => x.column_name).join(', '));
  }
  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
