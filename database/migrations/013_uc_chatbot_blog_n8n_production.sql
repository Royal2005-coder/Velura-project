-- UC Chatbot/Content production hardening.
-- Extends the existing chat tables, routes handoff into support tickets, and
-- adds public content tables for blog/about/policy pages.

begin;

do $$
begin
  if to_regclass('public.chat_session') is null then
    raise exception 'UC chatbot requires public.chat_session';
  end if;
  if to_regclass('public.chat_message') is null then
    raise exception 'UC chatbot requires public.chat_message';
  end if;
  if to_regclass('public.product') is null then
    raise exception 'UC chatbot requires public.product';
  end if;
  if to_regclass('public.support_ticket') is null then
    raise exception 'UC chatbot requires public.support_ticket';
  end if;
  if to_regclass('public.ai_log') is null then
    raise exception 'UC chatbot requires public.ai_log';
  end if;
end $$;

alter table public.chat_session
  add column if not exists profile_user_id uuid references public.users(user_id) on delete set null,
  add column if not exists source text not null default 'chatbot',
  add column if not exists handoff_status text not null default 'ai'
    check (handoff_status in ('ai', 'requested', 'assigned', 'closed')),
  add column if not exists support_ticket_id uuid references public.support_ticket(ticket_id) on delete set null,
  add column if not exists last_message_preview text,
  add column if not exists last_message_at timestamptz,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.chat_message
  add column if not exists product_ids uuid[] not null default '{}'::uuid[];

create index if not exists idx_chat_session_profile_updated
  on public.chat_session(profile_user_id, updated_at desc);
create index if not exists idx_chat_session_guest_updated
  on public.chat_session(guest_id, updated_at desc);
create index if not exists idx_chat_session_handoff
  on public.chat_session(handoff_status, updated_at desc)
  where handoff_status in ('requested', 'assigned');
create index if not exists idx_chat_session_support_ticket
  on public.chat_session(support_ticket_id);
create index if not exists idx_chat_message_created
  on public.chat_message(session_id, created_at asc);
create index if not exists idx_chat_message_product_ids
  on public.chat_message using gin(product_ids);

drop trigger if exists trg_chat_session_touch_updated_at on public.chat_session;
create trigger trg_chat_session_touch_updated_at
before update on public.chat_session
for each row execute function public.velura_touch_updated_at();

-- Chat data is accessed through the API gateway. The older anonymous policies
-- exposed all guest sessions to anon users, so revoke direct access here.
drop policy if exists chat_session_select_policy on public.chat_session;
drop policy if exists chat_session_insert_policy on public.chat_session;
drop policy if exists chat_session_update_policy on public.chat_session;
drop policy if exists chat_session_delete_policy on public.chat_session;
drop policy if exists chat_message_select_policy on public.chat_message;
drop policy if exists chat_message_insert_policy on public.chat_message;

alter table public.chat_session enable row level security;
alter table public.chat_message enable row level security;

drop policy if exists chat_session_admin_select on public.chat_session;
create policy chat_session_admin_select on public.chat_session
for select to authenticated
using ((select public.velura_has_admin_role(array['super_admin','admin_operator_cskh_dt'])));

drop policy if exists chat_message_admin_select on public.chat_message;
create policy chat_message_admin_select on public.chat_message
for select to authenticated
using (
  exists (
    select 1
    from public.chat_session s
    where s.session_id = chat_message.session_id
      and (select public.velura_has_admin_role(array['super_admin','admin_operator_cskh_dt']))
  )
);

revoke all on public.chat_session, public.chat_message from anon, authenticated;
grant select on public.chat_session, public.chat_message to authenticated;
grant all on public.chat_session, public.chat_message to service_role;

create table if not exists public.content_category (
  content_category_id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('blog', 'policy', 'page')),
  slug text not null,
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, slug)
);

create table if not exists public.blog (
  blog_id uuid primary key default gen_random_uuid(),
  category_slug text not null,
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  content text not null default '',
  image_url text,
  author text not null default 'Velura Editorial',
  read_minutes integer not null default 5 check (read_minutes between 1 and 60),
  is_featured boolean not null default false,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.policy (
  policy_id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  content jsonb not null default '[]'::jsonb,
  display_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_at timestamptz not null default now()
);

create table if not exists public.static_page (
  static_page_id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'published' check (status in ('draft', 'published', 'archived')),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_content_category_touch_updated_at on public.content_category;
create trigger trg_content_category_touch_updated_at
before update on public.content_category
for each row execute function public.velura_touch_updated_at();

drop trigger if exists trg_blog_touch_updated_at on public.blog;
create trigger trg_blog_touch_updated_at
before update on public.blog
for each row execute function public.velura_touch_updated_at();

drop trigger if exists trg_policy_touch_updated_at on public.policy;
create trigger trg_policy_touch_updated_at
before update on public.policy
for each row execute function public.velura_touch_updated_at();

drop trigger if exists trg_static_page_touch_updated_at on public.static_page;
create trigger trg_static_page_touch_updated_at
before update on public.static_page
for each row execute function public.velura_touch_updated_at();

create index if not exists idx_blog_status_published
  on public.blog(status, published_at desc);
create index if not exists idx_blog_category
  on public.blog(category_slug, published_at desc);
create index if not exists idx_policy_display
  on public.policy(status, display_order asc);
create index if not exists idx_static_page_slug
  on public.static_page(slug);

alter table public.content_category enable row level security;
alter table public.blog enable row level security;
alter table public.policy enable row level security;
alter table public.static_page enable row level security;

drop policy if exists content_category_public_select on public.content_category;
create policy content_category_public_select on public.content_category
for select to anon, authenticated
using (true);

drop policy if exists blog_public_select on public.blog;
create policy blog_public_select on public.blog
for select to anon, authenticated
using (status = 'published');

drop policy if exists policy_public_select on public.policy;
create policy policy_public_select on public.policy
for select to anon, authenticated
using (status = 'published');

drop policy if exists static_page_public_select on public.static_page;
create policy static_page_public_select on public.static_page
for select to anon, authenticated
using (status = 'published');

revoke insert, update, delete, truncate on public.content_category, public.blog, public.policy, public.static_page from anon, authenticated;
grant select on public.content_category, public.blog, public.policy, public.static_page to anon, authenticated;
grant all on public.content_category, public.blog, public.policy, public.static_page to service_role;

insert into public.content_category (content_type, slug, name, display_order)
values
  ('blog', 'trend', 'Xu hướng', 10),
  ('blog', 'style', 'Phối đồ', 20),
  ('blog', 'interview', 'Phỏng vấn', 30),
  ('blog', 'sustainable', 'Bền vững', 40),
  ('blog', 'event', 'Sự kiện', 50),
  ('policy', 'returns', 'Chính sách đổi trả', 10),
  ('policy', 'privacy', 'Chính sách bảo mật', 20),
  ('policy', 'shipping', 'Chính sách vận chuyển', 30),
  ('policy', 'terms', 'Điều khoản sử dụng', 40),
  ('policy', 'faq', 'Câu hỏi thường gặp', 50),
  ('policy', 'member', 'Chính sách thành viên', 60),
  ('page', 'about', 'Giới thiệu', 10)
on conflict (content_type, slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    updated_at = now();

insert into public.blog (slug, category_slug, title, excerpt, content, image_url, author, read_minutes, is_featured, published_at)
values
  (
    'bang-mau-mua-thu-2026',
    'trend',
    'Bảng màu mùa thu 2026: sắc nâu cognac và hồng phấn lên ngôi',
    'Velura gợi ý cách phối các sắc nâu cognac, hồng phấn và xanh sage cho tủ đồ mùa thu.',
    'Các gam màu ấm giúp trang phục tối giản có chiều sâu hơn. Hãy bắt đầu bằng một món chủ đạo màu cognac, sau đó thêm phụ kiện hồng phấn hoặc xanh sage để tổng thể mềm mại mà vẫn hiện đại.',
    '/src/assets/images/phu-kien_bom-toc-ban-to-theu-hoa-vintage_03.jpg',
    'Nguyễn Thu Hà',
    8,
    true,
    '2026-06-02 09:00:00+07'
  ),
  (
    'phoi-blazer-linen-mua-he',
    'style',
    'Cách phối blazer linen cho mùa hè nhiệt đới',
    'Bốn công thức phối blazer linen thoáng mát, thanh lịch và dễ ứng dụng hằng ngày.',
    'Blazer linen hợp với quần ống suông, chân váy midi và đầm hai dây. Chìa khóa là giữ bảng màu nhẹ, chọn lớp trong mỏng và ưu tiên phom dáng rộng vừa phải.',
    '/src/assets/images/image-8.png',
    'Lê Minh Châu',
    5,
    false,
    '2026-05-14 09:00:00+07'
  ),
  (
    'tu-do-capsule-it-hon-dep-hon',
    'sustainable',
    'Tủ đồ capsule: ít hơn để mặc đẹp hơn',
    'Cách xây dựng tủ đồ gọn, bền và dễ phối mà vẫn giữ được cá tính riêng.',
    'Một tủ đồ capsule hiệu quả bắt đầu bằng các món nền trung tính, chất liệu tốt và phom dáng phù hợp. Mỗi món nên phối được tối thiểu ba hoàn cảnh khác nhau.',
    '/src/assets/images/phu-kien_khan-lua-twilly-cham-bi_01.jpg',
    'Phạm Hoàng Linh',
    11,
    false,
    '2026-05-02 09:00:00+07'
  )
on conflict (slug) do update
set category_slug = excluded.category_slug,
    title = excluded.title,
    excerpt = excluded.excerpt,
    content = excluded.content,
    image_url = excluded.image_url,
    author = excluded.author,
    read_minutes = excluded.read_minutes,
    is_featured = excluded.is_featured,
    status = 'published',
    updated_at = now();

insert into public.policy (slug, title, summary, content, display_order)
values
  ('returns', 'Chính sách đổi trả', 'Đổi trả trong 7 ngày cho sản phẩm nguyên giá đủ điều kiện.', '[{"heading":"Thời gian đổi trả","items":["7 ngày kể từ ngày nhận hàng đối với sản phẩm nguyên giá.","3 ngày đối với sản phẩm giảm giá trên 30%."]},{"heading":"Điều kiện đổi trả","items":["Sản phẩm còn nguyên tem mác, chưa qua sử dụng.","Còn hóa đơn mua hàng hoặc mã đơn trực tuyến."]}]'::jsonb, 10),
  ('privacy', 'Chính sách bảo mật', 'Velura bảo vệ thông tin cá nhân và chỉ dùng dữ liệu cho vận hành đơn hàng, chăm sóc khách hàng.', '[{"heading":"Thông tin thu thập","items":["Họ tên, số điện thoại, email và địa chỉ giao hàng.","Lịch sử mua sắm và sở thích phong cách nếu khách hàng tự nguyện chia sẻ."]},{"heading":"Cam kết","items":["Không mua bán hoặc trao đổi dữ liệu khách hàng.","Dữ liệu được dùng để xử lý đơn hàng và nâng cao trải nghiệm."]}]'::jsonb, 20),
  ('shipping', 'Chính sách vận chuyển', 'Miễn phí vận chuyển cho đơn từ 500.000đ và hỗ trợ giao nhanh tại nội thành.', '[{"heading":"Thời gian giao hàng","items":["TP.HCM và Hà Nội: 1-2 ngày làm việc.","Các tỉnh thành khác: 3-5 ngày làm việc."]},{"heading":"Phí vận chuyển","items":["Miễn phí toàn quốc cho đơn từ 500.000đ.","Đơn dưới 500.000đ áp dụng phí theo khu vực."]}]'::jsonb, 30)
on conflict (slug) do update
set title = excluded.title,
    summary = excluded.summary,
    content = excluded.content,
    display_order = excluded.display_order,
    status = 'published',
    updated_at = now();

insert into public.static_page (slug, title, subtitle, content)
values (
  'about',
  'Về Velura',
  'Từ một xưởng may nhỏ đến thương hiệu thời trang được yêu mến',
  '{"story":["Velura ra đời với niềm tin rằng vẻ đẹp đích thực nằm ở sự thanh lịch có thể đồng hành qua nhiều mùa.","Chúng tôi ưu tiên chất liệu tự nhiên, phom dáng tinh tế và trải nghiệm tư vấn cá nhân hóa."],"values":[{"title":"Bền vững","text":"Ưu tiên chất liệu tự nhiên và bao bì có thể tái chế."},{"title":"Cá nhân hóa","text":"Mỗi khách hàng là một câu chuyện phong cách riêng."},{"title":"Thanh lịch","text":"Thiết kế vượt thời gian, mềm mại và tinh tế."}]}'::jsonb
)
on conflict (slug) do update
set title = excluded.title,
    subtitle = excluded.subtitle,
    content = excluded.content,
    status = 'published',
    updated_at = now();

commit;
