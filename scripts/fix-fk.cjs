const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Check FK on chat_session
  const fks = await client.query(`
    SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'chat_session' AND tc.constraint_type = 'FOREIGN KEY'
  `);
  console.log('chat_session FKs:');
  fks.rows.forEach(r => console.log(`  ${r.column_name} -> ${r.foreign_table}.${r.foreign_column}`));

  // Check support_ticket PK
  const pk = await client.query(`
    SELECT kcu.column_name FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'support_ticket' AND tc.constraint_type = 'PRIMARY KEY'
  `);
  console.log('\nsupport_ticket PK:');
  pk.rows.forEach(r => console.log(`  ${r.column_name}`));

  // Add the FK if missing
  const hasFk = fks.rows.some(r => r.column_name === 'support_ticket_id' && r.foreign_table === 'support_ticket');
  if (!hasFk) {
    console.log('\nAdding FK chat_session.support_ticket_id -> support_ticket.ticket_id...');
    await client.query(`
      ALTER TABLE chat_session 
      ADD CONSTRAINT chat_session_support_ticket_id_fkey 
      FOREIGN KEY (support_ticket_id) REFERENCES support_ticket(ticket_id) 
      ON DELETE SET NULL
    `);
    console.log('FK added!');
  } else {
    console.log('\nFK already exists');
  }

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
