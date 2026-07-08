-- ====================================================================
-- VELURA - FIX RLS & PERMISSIONS FOR USER API SERVER
-- ====================================================================
-- Chạy toàn bộ script này trong Supabase SQL Editor (hoặc pgAdmin).
-- Mục đích: Cho phép API server (dùng anon key) có thể đọc/ghi dữ liệu
-- trên các bảng users, orders, v.v. mà không bị RLS chặn.
--
-- LƯU Ý: Đây là cấu hình cho môi trường DEVELOPMENT.
-- Trong production, nên dùng Service Role Key + RLS policy chặt chẽ hơn.
-- ====================================================================

-- 1. Tắt RLS trên các bảng cần thiết cho API server
ALTER TABLE public.users            DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_profile    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart             DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.review           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_exchange  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_item      DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_session    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_log           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.category         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.combo_item       DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.voucher          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_product DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history    DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment          DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_admin_request DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     DISABLE ROW LEVEL SECURITY;

-- 2. Cấp đầy đủ quyền cho role anon (dùng bởi API server qua anon key)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Đảm bảo bảng mới tạo trong tương lai cũng được cấp quyền
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- 4. Thêm cột wishlist nếu chưa có
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::JSONB;

-- ====================================================================
-- KIỂM TRA: Sau khi chạy, thử lệnh này để xác nhận anon có quyền INSERT
-- INSERT INTO public.users (email, password_hash, full_name, role, is_active)
-- VALUES ('test_rls@velura.vn', 'test:hash', 'Test RLS', 'member', false);
-- DELETE FROM public.users WHERE email = 'test_rls@velura.vn';
-- ====================================================================
