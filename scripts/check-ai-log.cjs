const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check ai_log column types
  const cols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'ai_log' ORDER BY ordinal_position
  `);
  console.log('ai_log columns:');
  cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
