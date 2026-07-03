-- ====================================================================
-- VELURA USER BACKEND - PERMISSION GRANTS & SCHEMA UPDATES
-- Chạy script này trong pgAdmin 4 hoặc Supabase SQL Editor dưới quyền postgres admin.
-- Điều này cho phép API Server (kết nối qua Anon Key) có thể thực hiện
-- truy vấn đọc/ghi trên các bảng của phân hệ User.
-- ====================================================================

-- Đảm bảo cột wishlist tồn tại trong bảng users (Phương án A đã chốt)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::JSONB;

-- Cấp quyền cho các bảng hiện tại và tương lai trong public schema
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Đảm bảo các bảng tạo mới trong tương lai cũng tự động nhận quyền này
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
