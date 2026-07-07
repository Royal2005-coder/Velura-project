const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:UelVelura@123@db.drvkrpoojyncodfytftn.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  // Test "Order" view
  const orders = await client.query(`SELECT order_id, order_status, recipient_name, amount FROM public."Order" LIMIT 3`);
  console.log(`\n"Order" view (${orders.rows.length} rows):`);
  orders.rows.forEach(r => console.log(`  ${r.order_id} | ${r.order_status} | ${r.recipient_name} | ${r.amount}`));

  // Test "Products" view
  const products = await client.query(`SELECT product_id, product_name, product_category_name, price, stock_quantity FROM public."Products" LIMIT 5`);
  console.log(`\n"Products" view (${products.rows.length} rows):`);
  products.rows.forEach(r => console.log(`  ${r.product_id} | ${r.product_name} | ${r.product_category_name} | ${r.price} | stock:${r.stock_quantity}`));

  // Test "categories" view
  const cats = await client.query(`SELECT category_id, product_category_name, slug FROM public.categories`);
  console.log(`\n"categories" view (${cats.rows.length} rows):`);
  cats.rows.forEach(r => console.log(`  ${r.category_id} | ${r.product_category_name} | ${r.slug}`));

  // Test "conversation_logs" view (should be empty)
  const logs = await client.query(`SELECT COUNT(*) as count FROM public.conversation_logs`);
  console.log(`\n"conversation_logs" view: ${logs.rows[0].count} rows`);

  // Test filtering "Order" by order_id (simulating N8N getOrderStatus)
  const orderFilter = await client.query(`SELECT order_id, order_status, recipient_name, tracking_code FROM public."Order" WHERE order_id = (SELECT order_id FROM public."Order" LIMIT 1)`);
  console.log(`\n"Order" filter test: ${orderFilter.rows.length} rows`);
  if (orderFilter.rows.length > 0) console.log(`  Found: ${JSON.stringify(orderFilter.rows[0])}`);

  // Test filtering "Products" by product_category_name (simulating N8N getProductRecommendations)
  const prodFilter = await client.query(`SELECT product_name, price, stock_quantity FROM public."Products" WHERE product_category_name = (SELECT product_category_name FROM public."Products" LIMIT 1) LIMIT 3`);
  console.log(`\n"Products" filter test: ${prodFilter.rows.length} rows`);
  prodFilter.rows.forEach(r => console.log(`  ${r.product_name} | ${r.price} | stock:${r.stock_quantity}`));

  await client.end();
  console.log('\nALL VIEW TESTS PASSED');
}

run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
