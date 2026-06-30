insert into public.app_roles (code, name, description, is_admin, sort_order)
values
  ('super_admin', 'Admin quan tri', 'Full system administration', true, 1),
  ('product_admin', 'Admin quan ly san pham', 'Catalog and inventory administration', true, 10),
  ('order_admin', 'Admin quan ly don hang', 'Order and payment operations', true, 20),
  ('pricing_admin', 'Admin quan ly gia va khuyen mai', 'Pricing, vouchers and campaigns', true, 30),
  ('review_admin', 'Admin quan ly danh gia', 'Review moderation and escalation', true, 40),
  ('service_admin', 'Admin doi tra va CSKH', 'Return requests and customer support', true, 50),
  ('read_only_admin', 'Admin chi xem', 'Read-only reporting and logs', true, 90),
  ('member', 'Member', 'Customer account', false, 100)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  is_admin = excluded.is_admin,
  sort_order = excluded.sort_order;

insert into public.role_permissions (role_id, module, can_read, can_create, can_update, can_delete)
select r.id, p.module, p.can_read, p.can_create, p.can_update, p.can_delete
from public.app_roles r
join (
  values
    ('super_admin','dashboard',true,true,true,true),
    ('super_admin','accounts',true,true,true,true),
    ('super_admin','products',true,true,true,true),
    ('super_admin','categories',true,true,true,true),
    ('super_admin','orders',true,true,true,true),
    ('super_admin','payments',true,true,true,true),
    ('super_admin','reviews',true,true,true,true),
    ('super_admin','returns',true,true,true,true),
    ('super_admin','support_tickets',true,true,true,true),
    ('super_admin','pricing',true,true,true,true),
    ('super_admin','promotions',true,true,true,true),
    ('super_admin','vouchers',true,true,true,true),
    ('super_admin','bundles',true,true,true,true),
    ('super_admin','budgets',true,true,true,true),
    ('super_admin','audit_logs',true,false,false,false),
    ('product_admin','dashboard',true,false,false,false),
    ('product_admin','products',true,true,true,false),
    ('product_admin','categories',true,true,true,false),
    ('product_admin','inventory',true,true,true,false),
    ('product_admin','audit_logs',true,false,false,false),
    ('order_admin','dashboard',true,false,false,false),
    ('order_admin','orders',true,true,true,false),
    ('order_admin','payments',true,false,true,false),
    ('order_admin','shipments',true,true,true,false),
    ('order_admin','audit_logs',true,false,false,false),
    ('pricing_admin','dashboard',true,false,false,false),
    ('pricing_admin','pricing',true,true,true,false),
    ('pricing_admin','promotions',true,true,true,false),
    ('pricing_admin','vouchers',true,true,true,false),
    ('pricing_admin','bundles',true,true,true,false),
    ('pricing_admin','budgets',true,true,true,false),
    ('pricing_admin','audit_logs',true,false,false,false),
    ('review_admin','dashboard',true,false,false,false),
    ('review_admin','reviews',true,false,true,false),
    ('review_admin','support_tickets',true,true,true,false),
    ('review_admin','audit_logs',true,false,false,false),
    ('service_admin','dashboard',true,false,false,false),
    ('service_admin','returns',true,true,true,false),
    ('service_admin','support_tickets',true,true,true,false),
    ('service_admin','orders',true,false,true,false),
    ('service_admin','audit_logs',true,false,false,false),
    ('read_only_admin','dashboard',true,false,false,false),
    ('read_only_admin','audit_logs',true,false,false,false)
) as p(role_code, module, can_read, can_create, can_update, can_delete)
  on p.role_code = r.code
on conflict (role_id, module) do update set
  can_read = excluded.can_read,
  can_create = excluded.can_create,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete;

with roles as (
  select code, id from public.app_roles
)
insert into public.profiles (email, phone, full_name, role_id, status, customer_tier, metadata)
values
  ('admin@velura.vn', '0923456789', 'Pham Thu Huong', (select id from roles where code = 'super_admin'), 'active', 'staff', '{"seed":"admin"}'),
  ('product@velura.vn', '0912345678', 'Tran Minh Tuan', (select id from roles where code = 'product_admin'), 'active', 'staff', '{"seed":"admin"}'),
  ('order@velura.vn', '0934567890', 'Le Gia Linh', (select id from roles where code = 'order_admin'), 'active', 'staff', '{"seed":"admin"}'),
  ('price@velura.vn', '0956789012', 'Ngo Thanh Son', (select id from roles where code = 'pricing_admin'), 'active', 'staff', '{"seed":"admin"}'),
  ('cskh@velura.vn', '0967890123', 'Vu Thanh Mai', (select id from roles where code = 'service_admin'), 'active', 'staff', '{"seed":"admin"}'),
  ('lan.nguyen@email.com', '0901234567', 'Nguyen Thi Lan', (select id from roles where code = 'member'), 'active', 'member', '{"seed":"customer"}'),
  ('khoa.tran@email.com', '0912345679', 'Tran Minh Khoa', (select id from roles where code = 'member'), 'active', 'member', '{"seed":"customer"}')
on conflict (email) do update set
  phone = excluded.phone,
  full_name = excluded.full_name,
  role_id = excluded.role_id,
  status = excluded.status,
  customer_tier = excluded.customer_tier;

insert into public.categories (name, slug, description, status, sort_order)
values
  ('Ao khoac', 'ao-khoac', 'Blazer, cardigan, trench coat and outerwear', 'active', 10),
  ('Dam vay', 'dam-vay', 'Dress and skirt catalog', 'active', 20),
  ('Ao', 'ao', 'Tops and shirts', 'active', 30),
  ('Giay dep', 'giay-dep', 'Footwear', 'active', 40),
  ('Phu kien', 'phu-kien', 'Fashion accessories', 'active', 50)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

with cat as (
  select slug, id from public.categories
)
insert into public.products (sku, name, slug, category_id, original_price, sale_price, stock_quantity, min_stock_quantity, status, colors, sizes, image_url, description)
values
  ('BCR-004', 'Blazer cropped boucle', 'blazer-cropped-boucle', (select id from cat where slug = 'ao-khoac'), 2800000, 2450000, 36, 10, 'active', array['Be','Navy'], array['S','M','L','XL'], '/assets/images/product-silk-blazer.png', 'Premium cropped boucle blazer.'),
  ('VMX-012', 'Vay maxi tiered', 'vay-maxi-tiered', (select id from cat where slug = 'dam-vay'), 1500000, 1290000, 7, 10, 'active', array['Hoa xanh kem'], array['S','M','L'], '/assets/images/product-silk-blazer.png', 'Tiered maxi dress for weekend outfits.'),
  ('LSV-001', 'Ao so mi linen co V', 'ao-so-mi-linen-co-v', (select id from cat where slug = 'ao'), 990000, 890000, 0, 10, 'hidden', array['Kem','Trang'], array['S','M','L','XL'], '/assets/images/product-silk-blazer.png', 'Breathable linen V-neck shirt.'),
  ('ATR-005', 'Ao thun co tron oversize', 'ao-thun-co-tron-oversize', (select id from cat where slug = 'ao'), 500000, 450000, 15, 10, 'active', array['Den','Hong'], array['S','M','L','XL'], '/assets/images/product-silk-blazer.png', 'Cotton oversized tee.'),
  ('BCR-006', 'Blazer linen dang suong', 'blazer-linen-dang-suong', (select id from cat where slug = 'ao-khoac'), 2000000, 1850000, 9, 10, 'active', array['Navy'], array['S','M','L'], '/assets/images/product-silk-blazer.png', 'Minimal linen blazer.')
on conflict (sku) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  original_price = excluded.original_price,
  sale_price = excluded.sale_price,
  stock_quantity = excluded.stock_quantity,
  min_stock_quantity = excluded.min_stock_quantity,
  status = excluded.status,
  colors = excluded.colors,
  sizes = excluded.sizes,
  image_url = excluded.image_url,
  description = excluded.description;

with customer as (
  select id from public.profiles where email = 'lan.nguyen@email.com'
)
insert into public.orders (order_code, customer_profile_id, customer_name, customer_email, customer_phone, shipping_address, subtotal_amount, total_amount, payment_method, payment_status, status)
values
  ('ORD-2026-0081', (select id from customer), 'Nguyen Thi Lan', 'lan.nguyen@email.com', '0901234567', '{"line1":"123 Nguyen Hue","city":"TP.HCM"}', 1350000, 1350000, 'online', 'unpaid', 'pending'),
  ('ORD-2026-0080', null, 'Tran Minh Khoa', 'khoa.tran@email.com', '0912345678', '{"line1":"45 Le Loi","city":"TP.HCM"}', 890000, 890000, 'cod', 'unpaid', 'confirmed'),
  ('ORD-2026-0079', null, 'Pham Thi Hoa', 'hoa.pham@email.com', '0923456789', '{"line1":"78 Dinh Tien Hoang","city":"TP.HCM"}', 2100000, 2100000, 'card', 'paid', 'shipping'),
  ('ORD-2026-0078', null, 'Le Van Nam', 'nam.le@email.com', '0934567890', '{"line1":"12 Cach Mang Thang 8","city":"TP.HCM"}', 450000, 450000, 'wallet', 'error', 'pending')
on conflict (order_code) do update set
  status = excluded.status,
  payment_status = excluded.payment_status,
  total_amount = excluded.total_amount;

with o as (
  select order_code, id from public.orders
),
p as (
  select sku, id, name, sale_price from public.products
)
insert into public.order_items (order_id, product_id, sku, product_name, variant, quantity, unit_price, total_price)
select o.id, p.id, p.sku, p.name, x.variant, x.quantity, p.sale_price, p.sale_price * x.quantity
from (
  values
    ('ORD-2026-0081','LSV-001','M / Trang',1),
    ('ORD-2026-0081','ATR-005','S / Den',1),
    ('ORD-2026-0080','BCR-004','M / Be',1),
    ('ORD-2026-0079','VMX-012','L / Hoa',2)
) as x(order_code, sku, variant, quantity)
join o on o.order_code = x.order_code
join p on p.sku = x.sku
where not exists (
  select 1 from public.order_items oi where oi.order_id = o.id and oi.sku = p.sku and oi.variant = x.variant
);

with p as (
  select sku, id from public.products
),
o as (
  select order_code, id from public.orders
)
insert into public.reviews (product_id, order_id, customer_name, contact, rating, body, status, alert_level)
values
  ((select id from p where sku = 'LSV-001'), (select id from o where order_code = 'ORD-2026-0081'), 'Nguyen Thi Lan', 'lan.nguyen@email.com', 5, 'Chat vai mat, form dep va giao hang nhanh.', 'pending', 'normal'),
  ((select id from p where sku = 'VMX-012'), (select id from o where order_code = 'ORD-2026-0079'), 'Pham Thi Hoa', 'hoa.pham@email.com', 2, 'Vay bi loi duong chi, can ho tro doi hang som.', 'pending', 'urgent'),
  ((select id from p where sku = 'ATR-005'), (select id from o where order_code = 'ORD-2026-0078'), 'Le Van Nam', '0934567890', 1, 'San pham khong giong mo ta, can lien he ho tro.', 'ticket', 'keyword')
on conflict do nothing;

with o as (
  select order_code, id from public.orders
)
insert into public.return_requests (request_code, order_id, customer_name, customer_phone, customer_email, type, product_summary, reason, status)
values
  ('RTN-1024', (select id from o where order_code = 'ORD-2026-0081'), 'Nguyen Thi Lan', '0901234567', 'lan.nguyen@email.com', 'refund', 'Ao so mi linen co V', 'San pham bi loi duong may.', 'pending'),
  ('RTN-1023', (select id from o where order_code = 'ORD-2026-0079'), 'Pham Thi Hoa', null, 'hoa.pham@email.com', 'exchange', 'Vay maxi tiered', 'Muon doi size L sang M.', 'processing')
on conflict (request_code) do update set
  status = excluded.status,
  reason = excluded.reason;

insert into public.support_tickets (ticket_code, customer_name, customer_phone, customer_email, type, subject, content, priority, status, csat_status)
values
  ('CSKH-2048', 'Le Van Nam', '0934567890', null, 'complaint', 'San pham khong giong mo ta', 'Can ho tro lien he som.', 'high', 'new', 'not_sent'),
  ('CSKH-2047', 'Nguyen Thi Lan', null, 'lan.nguyen@email.com', 'order', 'Cap nhat thoi gian giao hang', 'Can cap nhat thoi gian giao hang cho ORD-2026-0081.', 'medium', 'processing', 'pending')
on conflict (ticket_code) do update set
  status = excluded.status,
  priority = excluded.priority;

insert into public.promotions (code, name, type, discount_value, max_discount_amount, min_order_amount, scope_type, scope_config, starts_at, ends_at, status)
values
  ('SALE-SUMMER', 'Summer Sale 2026', 'percentage', 20, 80000, 500000, 'category', '{"categories":["ao","dam-vay"]}', '2026-06-20T00:00:00+07:00', '2026-06-30T23:59:00+07:00', 'active'),
  ('MB-DAY', 'Member Day', 'fixed_amount', 100000, 100000, 500000, 'customer_group', '{"customer_group":"member"}', '2026-06-28T00:00:00+07:00', '2026-06-29T23:59:00+07:00', 'scheduled')
on conflict (code) do update set
  name = excluded.name,
  status = excluded.status,
  scope_config = excluded.scope_config;

with promo as (
  select code, id from public.promotions
)
insert into public.vouchers (promotion_id, code, name, type, value, max_discount_amount, min_order_amount, usage_limit, usage_count, customer_group, expires_at, status)
values
  ((select id from promo where code = 'SALE-SUMMER'), 'VELURA20', 'Chien dich khach moi', 'percentage', 20, 80000, 400000, 500, 226, 'new_user', '2026-06-30T23:59:00+07:00', 'active'),
  (null, 'FREESHIP06', 'Free ship thang 6', 'free_shipping', 30000, 30000, 300000, 1000, 730, 'all_users', '2026-06-30T23:59:00+07:00', 'active')
on conflict (code) do update set
  usage_count = excluded.usage_count,
  status = excluded.status;

insert into public.bundles (code, name, product_summary, retail_total, bundle_price, starts_at, ends_at, status, sales_count, revenue_amount)
values
  ('CB-OFFICE', 'Office Linen Set', 'Ao linen, quan culottes, that lung', 1580000, 1390000, '2026-06-20T00:00:00+07:00', '2026-06-30T23:59:00+07:00', 'active', 86, 119000000),
  ('CB-DRESS', 'Weekend Dress Kit', 'Vay maxi, tui hobo', 2120000, 1790000, '2026-06-28T00:00:00+07:00', '2026-07-07T23:59:00+07:00', 'scheduled', 12, 21000000)
on conflict (code) do update set
  status = excluded.status,
  sales_count = excluded.sales_count,
  revenue_amount = excluded.revenue_amount;

with promo as (
  select code, id from public.promotions
)
insert into public.promotion_budgets (promotion_id, name, limit_amount, used_amount, status, formula)
values
  ((select id from promo where code = 'SALE-SUMMER'), 'Ngan sach Summer Sale', 80000000, 54400000, 'warning', '500 codes x 80000'),
  ((select id from promo where code = 'MB-DAY'), 'Ngan sach Member Day', 20000000, 0, 'normal', '100 codes x 100000')
on conflict (promotion_id) do update set
  name = excluded.name,
  limit_amount = excluded.limit_amount,
  used_amount = excluded.used_amount,
  status = excluded.status,
  formula = excluded.formula;
