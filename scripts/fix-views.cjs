const { Client } = require('pg');
const client = new Client({
  connectionString: (process.env.SUPABASE_DIRECT_URL || process.env.SUPABASE_DB_URL),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Fix: drop FK constraint on ai_log.session_id, then recreate with NULL allowed
  // N8N uses its own session IDs that don't exist in guest_session
  
  // Option 1: Drop the FK constraint
  try {
    await client.query(`ALTER TABLE public.ai_log DROP CONSTRAINT IF EXISTS ai_log_session_id_fkey`);
    console.log('Dropped ai_log_session_id_fkey');
  } catch (e) {
    console.log('Drop FK error:', e.message);
  }

  // Option 2: Make session_id nullable (it might already be)
  try {
    await client.query(`ALTER TABLE public.ai_log ALTER COLUMN session_id DROP NOT NULL`);
    console.log('Made session_id nullable');
  } catch (e) {
    console.log('Nullable error:', e.message);
  }

  // Update trigger to pass NULL for session_id
  await client.query(`
    CREATE OR REPLACE FUNCTION public.fn_conversation_logs_insert()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO public.ai_log (
        log_type, user_id, session_id, messages,
        recommended_products, clicked_products, purchased_products,
        escalated_to_human
      ) VALUES (
        'chatbot_session',
        NULL,
        NULL,
        jsonb_build_array(
          jsonb_build_object('role', 'user', 'content', NEW.user_message),
          jsonb_build_object('role', 'assistant', 'content', NEW.bot_response)
        ),
        CASE WHEN NEW.product_id IS NOT NULL AND NEW.product_id != '' 
             THEN to_jsonb(ARRAY[NEW.product_id]) ELSE '[]'::jsonb END,
        '[]'::jsonb,
        '[]'::jsonb,
        false
      );
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('Updated trigger function');

  // Test
  try {
    await client.query(`
      INSERT INTO public.conversation_logs (session_id, user_email, user_message, bot_response, intent, product_category_name, product_id, order_id, ticket_id, channel, status, metadata)
      VALUES ('test-n8n-session', 'test@test.com', 'Xin chào shop', 'Chào bạn! Velura có thể giúp gì?', 'general', '', '', '', '', 'web_chat', 'success', '{"source":"n8n_test"}')
    `);
    console.log('Test INSERT PASSED');
    const r = await client.query(`SELECT log_id, messages, recommended_products FROM public.ai_log ORDER BY created_at DESC LIMIT 1`);
    if (r.rows.length > 0) {
      console.log('Verified:', JSON.stringify(r.rows[0]));
      await client.query(`DELETE FROM public.ai_log WHERE log_id = $1`, [r.rows[0].log_id]);
      console.log('Cleaned up');
    }
  } catch (e) {
    console.log('Test failed:', e.message);
  }

  await client.end();
  console.log('DONE');
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
