const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check email outbox RPC functions
  const funcs = await client.query(`
    SELECT routine_name, routine_type FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND (routine_name LIKE '%email%' OR routine_name LIKE '%outbox%')
    ORDER BY routine_name
  `);
  console.log('Email/outbox functions:');
  funcs.rows.forEach(r => console.log(`  ${r.routine_name} (${r.routine_type})`));

  // Check email_outbox table
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE '%email%'
  `);
  console.log('\nEmail tables:');
  tables.rows.forEach(r => console.log(`  ${r.table_name}`));

  // Check if email_outbox table exists and its columns
  if (tables.rows.some(r => r.table_name === 'email_outbox')) {
    const cols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'email_outbox' ORDER BY ordinal_position
    `);
    console.log('\nemail_outbox columns:');
    cols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
  }

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
