const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check chat_session columns
  const csCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'chat_session' ORDER BY ordinal_position
  `);
  console.log('chat_session columns:');
  csCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // Check chat_message columns
  const cmCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'chat_message' ORDER BY ordinal_position
  `);
  console.log('\nchat_message columns:');
  cmCols.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

  // Check data counts
  const csCount = await client.query(`SELECT COUNT(*) as count FROM chat_session`);
  const cmCount = await client.query(`SELECT COUNT(*) as count FROM chat_message`);
  const prodCount = await client.query(`SELECT COUNT(*) as count FROM product WHERE status = 'on_sale'`);
  console.log(`\nchat_session: ${csCount.rows[0].count} rows`);
  console.log(`chat_message: ${cmCount.rows[0].count} rows`);
  console.log(`products (on_sale): ${prodCount.rows[0].count} rows`);

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
