const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // 1. "Order" view - N8N filters by order_id
  await client.query(`DROP VIEW IF EXISTS public."Order" CASCADE`);
  await client.query(`
    CREATE OR REPLACE VIEW public."Order" AS
    SELECT
      o.order_id,
      o.order_id::text AS order_id_text,
      o.status::text AS order_status,
      o.shipping_name AS recipient_name,
      o.shipping_phone AS recipient_phone,
      o.shipping_address,
      o.subtotal AS amount,
      o.total_amount,
      o.payment_method,
      o.tracking_code,
      o.order_date AS order_date,
      o.delivered_at AS delivery_date,
      o.created_at,
      o.updated_at,
      u.full_name AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone
    FROM public.orders o
    LEFT JOIN public.users u ON o.user_id = u.user_id;
  `);
  console.log('1/5 View "Order" created');

  // 2. "Products" view - N8N filters by product_category_name
  await client.query(`DROP VIEW IF EXISTS public."Products" CASCADE`);
  await client.query(`
    CREATE OR REPLACE VIEW public."Products" AS
    SELECT
      p.product_id,
      p.sku AS product_id_text,
      p.name AS product_name,
      p.description AS product_description,
      p.base_price AS price,
      p.sale_price,
      p.status,
      p.brand AS brand_name,
      p.style_tags,
      p.occasions AS gift_occasion,
      p.suitable_body_shapes AS target_audience,
      p.images,
      p.is_featured,
      p.collection,
      c.name AS product_category_name,
      c.slug AS category_slug,
      COALESCE(
        (SELECT SUM(v.stock_quantity - v.reserved_quantity) FROM public.variant v WHERE v.product_id = p.product_id),
        0
      ) AS stock_quantity,
      p.created_at,
      p.updated_at
    FROM public.product p
    LEFT JOIN public.category c ON p.category_id = c.category_id;
  `);
  console.log('2/5 View "Products" created');

  // 3. "categories" view - N8N filters by product_category_name
  await client.query(`DROP VIEW IF EXISTS public.categories CASCADE`);
  await client.query(`
    CREATE OR REPLACE VIEW public.categories AS
    SELECT
      category_id,
      name AS product_category_name,
      slug,
      display_order
    FROM public.category;
  `);
  console.log('3/5 View "categories" created');

  // 4. "support_tickets" view - N8N inserts with ticket_id, user_email, product_category_name, issue, status
  await client.query(`DROP VIEW IF EXISTS public.support_tickets CASCADE`);
  await client.query(`
    CREATE OR REPLACE VIEW public.support_tickets AS
    SELECT
      ticket_id::text AS ticket_id,
      user_id,
      guest_email AS user_email,
      guest_phone,
      title,
      description AS issue,
      priority::text AS priority,
      status::text AS status,
      admin_reply,
      csat_score,
      ai_log_id,
      created_at,
      resolved_at,
      updated_at
    FROM public.support_ticket;
  `);
  console.log('4/5 View "support_tickets" created');

  // 5. "conversation_logs" view - N8N inserts with session_id, user_email, user_message, bot_response, intent, product_category_name, product_id, order_id, ticket_id, channel, status, metadata
  await client.query(`DROP VIEW IF EXISTS public.conversation_logs CASCADE`);
  await client.query(`
    CREATE OR REPLACE VIEW public.conversation_logs AS
    SELECT
      log_id,
      log_type,
      user_id,
      session_id,
      messages,
      image_urls,
      recommended_products,
      clicked_products,
      purchased_products,
      ctr,
      quiz_results,
      escalated_to_human,
      created_at
    FROM public.ai_log;
  `);
  console.log('5/5 View "conversation_logs" created');

  // Grant permissions
  const views = ['"Order"', '"Products"', 'categories', 'support_tickets', 'conversation_logs'];
  for (const v of views) {
    await client.query(`GRANT SELECT ON public.${v} TO service_role, anon, authenticated`);
    await client.query(`GRANT INSERT ON public.${v} TO service_role, anon, authenticated`);
    await client.query(`GRANT UPDATE ON public.${v} TO service_role`);
    await client.query(`GRANT DELETE ON public.${v} TO service_role`);
  }
  console.log('Permissions granted on all views');

  // Verify
  const r = await client.query(`
    SELECT table_name FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name IN ('Order','Products','categories','support_tickets','conversation_logs')
    ORDER BY table_name
  `);
  console.log('Verified views:', r.rows.map(x => x.table_name).join(', '));

  await client.end();
  console.log('ALL VIEWS DONE');
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
