create extension if not exists pgcrypto;

create table if not exists public.app_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  is_admin boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.app_roles(id) on delete cascade,
  module text not null,
  can_read boolean not null default true,
  can_create boolean not null default false,
  can_update boolean not null default false,
  can_delete boolean not null default false,
  created_at timestamptz not null default now(),
  unique (role_id, module)
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role_id uuid references public.app_roles(id) on delete set null,
  email text not null unique,
  phone text,
  full_name text not null,
  avatar_url text,
  status text not null default 'active' check (status in ('active','pending','locked_temp','locked_perm','inactive')),
  customer_tier text not null default 'member',
  locked_reason text,
  unlocked_reason text,
  locked_by uuid references public.profiles(id) on delete set null,
  locked_at timestamptz,
  last_login_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  status text not null default 'active' check (status in ('active','hidden','archived')),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  sku text not null unique,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  original_price numeric(14,2) not null default 0,
  sale_price numeric(14,2) not null default 0,
  cost_price numeric(14,2),
  currency text not null default 'VND',
  stock_quantity integer not null default 0,
  min_stock_quantity integer not null default 10,
  status text not null default 'active' check (status in ('draft','active','hidden','discontinued')),
  status_reason text,
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  seo_title text,
  seo_description text,
  ai_tags text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  old_original_price numeric(14,2),
  new_original_price numeric(14,2),
  old_sale_price numeric(14,2),
  new_sale_price numeric(14,2),
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  subtotal_amount numeric(14,2) not null default 0,
  shipping_fee numeric(14,2) not null default 0,
  discount_amount numeric(14,2) not null default 0,
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'VND',
  status text not null default 'pending' check (status in ('pending','confirmed','preparing','shipping','completed','cancelled','held','returned')),
  status_reason text,
  payment_method text not null default 'cod',
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','error','failed','refunded','no_refund')),
  payment_transaction_code text,
  payment_resolution_note text,
  refund_status text check (refund_status in ('pending_refund','refunded','failed','no_refund')),
  carrier text,
  tracking_code text,
  cancel_reason text,
  cancelled_by uuid references public.profiles(id) on delete set null,
  cancelled_at timestamptz,
  risk_note text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  sku text not null,
  product_name text not null,
  variant text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  total_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  contact text,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden','replied','ticket')),
  alert_level text not null default 'normal' check (alert_level in ('normal','negative','urgent','keyword')),
  admin_response text,
  moderated_by uuid references public.profiles(id) on delete set null,
  moderated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique,
  order_id uuid references public.orders(id) on delete set null,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  type text not null check (type in ('refund','exchange')),
  product_summary text not null,
  reason text not null,
  evidence_urls text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','processing','approved','rejected','refunded','exchanged','expired')),
  deadline_at timestamptz not null default (now() + interval '48 hours'),
  resolution_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_code text not null unique,
  customer_profile_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  type text not null default 'support',
  subject text not null,
  content text not null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'new' check (status in ('new','processing','forwarded','replied','resolved','closed')),
  assigned_department text,
  response_note text,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  csat_status text not null default 'not_sent' check (csat_status in ('not_sent','pending','sent','received')),
  csat_score integer check (csat_score between 1 and 5),
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  type text not null check (type in ('percentage','fixed_amount','free_shipping')),
  discount_value numeric(14,2) not null default 0,
  max_discount_amount numeric(14,2),
  min_order_amount numeric(14,2) not null default 0,
  scope_type text not null default 'all' check (scope_type in ('all','category','product','customer_group')),
  scope_config jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','active','paused','stopped','expired')),
  status_reason text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid references public.promotions(id) on delete set null,
  code text not null unique,
  name text not null,
  type text not null check (type in ('percentage','fixed_amount','free_shipping')),
  value numeric(14,2) not null default 0,
  max_discount_amount numeric(14,2),
  min_order_amount numeric(14,2) not null default 0,
  usage_limit integer,
  usage_count integer not null default 0,
  per_user_limit integer not null default 1,
  customer_group text not null default 'all_users',
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active','paused','used_up','expired','cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bundles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  product_ids uuid[] not null default '{}',
  product_summary text,
  retail_total numeric(14,2) not null default 0,
  bundle_price numeric(14,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled','active','paused','stopped','expired')),
  sales_count integer not null default 0,
  revenue_amount numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_budgets (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid unique references public.promotions(id) on delete cascade,
  name text not null,
  limit_amount numeric(14,2) not null default 0,
  used_amount numeric(14,2) not null default 0,
  status text not null default 'normal' check (status in ('normal','warning','stopped')),
  formula text,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  actor_name text not null default 'system',
  actor_role text not null default 'system',
  module text not null,
  action text not null,
  target_table text,
  target_id uuid,
  target_code text,
  result text not null default 'success' check (result in ('success','warning','failed','conflict')),
  severity text not null default 'normal' check (severity in ('normal','attention','critical')),
  summary text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create table if not exists public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  body text not null,
  status text not null default 'pending' check (status in ('pending','sending','success','failed')),
  attempts integer not null default 0,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.current_role_code()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select r.code
  from public.profiles p
  join public.app_roles r on r.id = p.role_id
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select r.is_admin
    from public.profiles p
    join public.app_roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
    limit 1
  ), false)
$$;

create or replace function public.has_admin_module(module_name text, action_name text default 'read')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select
      r.code = 'super_admin'
      or exists (
        select 1
        from public.role_permissions rp
        where rp.role_id = r.id
          and rp.module = module_name
          and (
            (action_name = 'read' and rp.can_read)
            or (action_name = 'create' and rp.can_create)
            or (action_name = 'update' and rp.can_update)
            or (action_name = 'delete' and rp.can_delete)
          )
      )
    from public.profiles p
    join public.app_roles r on r.id = p.role_id
    where p.auth_user_id = auth.uid()
      and p.status = 'active'
    limit 1
  ), false)
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_roles','profiles','categories','products','orders','reviews','return_requests',
    'support_tickets','promotions','vouchers','bundles','promotion_budgets','email_outbox'
  ]
  loop
    execute format('drop trigger if exists trg_%I_touch_updated_at on public.%I', table_name, table_name);
    execute format(
      'create trigger trg_%I_touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',
      table_name,
      table_name
    );
  end loop;
end $$;

alter table public.app_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_price_history enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.reviews enable row level security;
alter table public.return_requests enable row level security;
alter table public.support_tickets enable row level security;
alter table public.promotions enable row level security;
alter table public.vouchers enable row level security;
alter table public.bundles enable row level security;
alter table public.promotion_budgets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.email_outbox enable row level security;

drop policy if exists "roles readable by authenticated users" on public.app_roles;
create policy "roles readable by authenticated users"
on public.app_roles for select
to authenticated
using (true);

drop policy if exists "role permissions readable by admins" on public.role_permissions;
create policy "role permissions readable by admins"
on public.role_permissions for select
to authenticated
using (public.is_admin());

drop policy if exists "profiles select own or admin" on public.profiles;
create policy "profiles select own or admin"
on public.profiles for select
to authenticated
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles update by account admins" on public.profiles;
create policy "profiles update by account admins"
on public.profiles for update
to authenticated
using (public.has_admin_module('accounts','update'))
with check (public.has_admin_module('accounts','update'));

drop policy if exists "catalog public read categories" on public.categories;
create policy "catalog public read categories"
on public.categories for select
to anon, authenticated
using (status = 'active' or public.has_admin_module('products','read'));

drop policy if exists "catalog public read products" on public.products;
create policy "catalog public read products"
on public.products for select
to anon, authenticated
using (status = 'active' or public.has_admin_module('products','read'));

drop policy if exists "categories write by product admins" on public.categories;
create policy "categories write by product admins"
on public.categories for all
to authenticated
using (public.has_admin_module('products','update'))
with check (public.has_admin_module('products','update'));

drop policy if exists "products write by product admins" on public.products;
create policy "products write by product admins"
on public.products for all
to authenticated
using (public.has_admin_module('products','update'))
with check (public.has_admin_module('products','update'));

drop policy if exists "orders select own or admin" on public.orders;
create policy "orders select own or admin"
on public.orders for select
to authenticated
using (customer_profile_id = public.current_profile_id() or public.has_admin_module('orders','read'));

drop policy if exists "orders write by order admins" on public.orders;
create policy "orders write by order admins"
on public.orders for all
to authenticated
using (public.has_admin_module('orders','update'))
with check (public.has_admin_module('orders','update'));

drop policy if exists "order items select own order or admin" on public.order_items;
create policy "order items select own order or admin"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (o.customer_profile_id = public.current_profile_id() or public.has_admin_module('orders','read'))
  )
);

drop policy if exists "order items write by order admins" on public.order_items;
create policy "order items write by order admins"
on public.order_items for all
to authenticated
using (public.has_admin_module('orders','update'))
with check (public.has_admin_module('orders','update'));

drop policy if exists "reviews select own public or admin" on public.reviews;
create policy "reviews select own public or admin"
on public.reviews for select
to anon, authenticated
using (status = 'approved' or customer_profile_id = public.current_profile_id() or public.has_admin_module('reviews','read'));

drop policy if exists "reviews write by review admins" on public.reviews;
create policy "reviews write by review admins"
on public.reviews for all
to authenticated
using (public.has_admin_module('reviews','update'))
with check (public.has_admin_module('reviews','update'));

drop policy if exists "returns select own or admin" on public.return_requests;
create policy "returns select own or admin"
on public.return_requests for select
to authenticated
using (customer_profile_id = public.current_profile_id() or public.has_admin_module('returns','read'));

drop policy if exists "returns write by service admins" on public.return_requests;
create policy "returns write by service admins"
on public.return_requests for all
to authenticated
using (public.has_admin_module('returns','update'))
with check (public.has_admin_module('returns','update'));

drop policy if exists "tickets select own or admin" on public.support_tickets;
create policy "tickets select own or admin"
on public.support_tickets for select
to authenticated
using (customer_profile_id = public.current_profile_id() or public.has_admin_module('support_tickets','read'));

drop policy if exists "tickets write by service admins" on public.support_tickets;
create policy "tickets write by service admins"
on public.support_tickets for all
to authenticated
using (public.has_admin_module('support_tickets','update'))
with check (public.has_admin_module('support_tickets','update'));

drop policy if exists "promotions public read active" on public.promotions;
create policy "promotions public read active"
on public.promotions for select
to anon, authenticated
using (status = 'active' or public.has_admin_module('promotions','read'));

drop policy if exists "promotions write by pricing admins" on public.promotions;
create policy "promotions write by pricing admins"
on public.promotions for all
to authenticated
using (public.has_admin_module('promotions','update'))
with check (public.has_admin_module('promotions','update'));

drop policy if exists "vouchers public read active" on public.vouchers;
create policy "vouchers public read active"
on public.vouchers for select
to anon, authenticated
using (status = 'active' or public.has_admin_module('vouchers','read'));

drop policy if exists "vouchers write by pricing admins" on public.vouchers;
create policy "vouchers write by pricing admins"
on public.vouchers for all
to authenticated
using (public.has_admin_module('vouchers','update'))
with check (public.has_admin_module('vouchers','update'));

drop policy if exists "bundles public read active" on public.bundles;
create policy "bundles public read active"
on public.bundles for select
to anon, authenticated
using (status = 'active' or public.has_admin_module('bundles','read'));

drop policy if exists "bundles write by pricing admins" on public.bundles;
create policy "bundles write by pricing admins"
on public.bundles for all
to authenticated
using (public.has_admin_module('bundles','update'))
with check (public.has_admin_module('bundles','update'));

drop policy if exists "budgets read by pricing admins" on public.promotion_budgets;
create policy "budgets read by pricing admins"
on public.promotion_budgets for select
to authenticated
using (public.has_admin_module('budgets','read'));

drop policy if exists "budgets write by pricing admins" on public.promotion_budgets;
create policy "budgets write by pricing admins"
on public.promotion_budgets for all
to authenticated
using (public.has_admin_module('budgets','update'))
with check (public.has_admin_module('budgets','update'));

drop policy if exists "audit logs readable by admins" on public.audit_logs;
create policy "audit logs readable by admins"
on public.audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "email outbox readable by admins" on public.email_outbox;
create policy "email outbox readable by admins"
on public.email_outbox for select
to authenticated
using (public.is_admin());

create index if not exists idx_profiles_auth_user_id on public.profiles(auth_user_id);
create index if not exists idx_profiles_role_id on public.profiles(role_id);
create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_orders_customer_profile_id on public.orders(customer_profile_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_payment_status on public.orders(payment_status);
create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_reviews_status on public.reviews(status);
create index if not exists idx_returns_status on public.return_requests(status);
create index if not exists idx_tickets_status on public.support_tickets(status);
create index if not exists idx_promotions_status on public.promotions(status);
create index if not exists idx_vouchers_code on public.vouchers(code);
create index if not exists idx_audit_logs_module_created_at on public.audit_logs(module, created_at desc);
