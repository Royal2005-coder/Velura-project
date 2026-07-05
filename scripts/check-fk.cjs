const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check FK constraints on ai_log
  const fks = await client.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'ai_log' AND tc.constraint_type = 'FOREIGN KEY'
  `);
  console.log('ai_log FK constraints:');
  fks.rows.forEach(r => console.log(`  ${r.column_name} -> ${r.foreign_table_name}`));

  await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
