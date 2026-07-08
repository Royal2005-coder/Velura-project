const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check RLS policies on chat_message
  const rls = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies WHERE tablename IN ('chat_message', 'chat_session') ORDER BY tablename, policyname
  `);
  console.log('RLS policies:');
  rls.rows.forEach(r => console.log(`  ${r.tablename}: ${r.policyname} (${r.cmd}) roles=${r.roles}`));

  // Check if RLS is enabled
  const tblOpts = await client.query(`
    SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('chat_message', 'chat_session')
  `);
  console.log('\nRLS enabled:');
  tblOpts.rows.forEach(r => console.log(`  ${r.tablename}: ${r.rowsecurity}`));

  // Test insert directly
  try {
    await client.query(`
      INSERT INTO chat_message (message_id, session_id, sender, text, metadata, product_ids, created_at)
      VALUES (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'user', 'test', '{}', '{}', now())
    `);
    console.log('\nDirect INSERT: OK');
    await client.query(`DELETE FROM chat_message WHERE session_id = '00000000-0000-0000-0000-000000000001'`);
  } catch(e) {
    console.log('\nDirect INSERT error:', e.message);
  }

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
