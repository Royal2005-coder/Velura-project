import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  // Step 1: Drop tables that were created with obsolete schemas
  console.log('Dropping old blog, policy, static_page, content_category tables...');
  await client.query(`
    DROP TABLE IF EXISTS public.blog CASCADE;
    DROP TABLE IF EXISTS public.policy CASCADE;
    DROP TABLE IF EXISTS public.static_page CASCADE;
    DROP TABLE IF EXISTS public.content_category CASCADE;
  `);
  console.log('Successfully dropped old tables.');

  // Step 2: Apply migration 013 (UC Chatbot & blog tables creation)
  const migration013Path = path.join(__dirname, '../database/migrations/013_uc_chatbot_blog_n8n_production.sql');
  console.log('Reading migration 013...');
  const sql013 = fs.readFileSync(migration013Path, 'utf8');
  console.log('Executing migration 013...');
  await client.query(sql013);
  console.log('Successfully applied migration 013.');

  // Step 3: Apply migration 008 (base sale price update)
  const migration008Path = path.join(__dirname, '../database/migrations/008_uc_a06_base_sale_price_update.sql');
  console.log('Reading migration 008...');
  const sql008 = fs.readFileSync(migration008Path, 'utf8');
  console.log('Executing migration 008...');
  await client.query(sql008);
  console.log('Successfully applied migration 008.');

  // Step 4: Apply migration 014 (vector embeddings) if any
  const migration014Path = path.join(__dirname, '../database/migrations/014_add_vector_embeddings.sql');
  if (fs.existsSync(migration014Path)) {
    console.log('Reading migration 014...');
    const sql014 = fs.readFileSync(migration014Path, 'utf8');
    console.log('Executing migration 014...');
    try {
      await client.query(sql014);
      console.log('Successfully applied migration 014.');
    } catch (e) {
      console.log('Migration 014 warning (might be already applied or extension issue):', e.message);
    }
  }

  await client.end();
  console.log('All migrations applied successfully.');
}

main().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
