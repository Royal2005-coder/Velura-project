# Thiet ke UC-A01 - Quan ly tai khoan

## Frontend

- Trang `accounts.html` tai danh sach tu `/api/v1/admin/accounts` khi co Supabase session.
- Tim kiem, loc role/trang thai va phan trang duoc gui ve server.
- Form khoa/mo khoa dem tu va chan submit neu ly do khong tren 10 tu.
- Moi mutation gui `expectedVersion`; `409` bat buoc tai lai dong du lieu.
- Nut thao tac chi hien khi `allowedPages` co `accounts`, nhung backend van la diem quyet dinh quyen.
- Mock localStorage chi chay khi `VELURA_DEMO_MODE=true` hoac khong co runtime Supabase client trong ban demo tinh.

## Backend

- Dedicated route: `apps/api/src/accounts/account-router.js`.
- Service nghiep vu: `apps/api/src/accounts/account-service.js`.
- Repository Supabase: `apps/api/src/accounts/account-repository.js`.
- Read dung REST voi allowlist cot an toan; write dung PostgreSQL RPC de account, audit va outbox cung transaction.
- API version hoa tai `/api/v1`; route cu duoc giu tam thoi cho tuong thich nhung account action se di qua service moi.

## Database

- Canonical tables: `users`, `approval_admin_request`, `audit_log`.
- Them cac cot dieu khien con thieu: `auth_user_id`, `lock_type`, ly do, actor/timestamp, `version`, `updated_at`.
- Tao `email_outbox` va cac RPC `admin_*` voi `security definer`, `search_path` co dinh va revoke `public`.
- RPC tu kiem tra actor/role, validation, optimistic lock va separation of duties.

## Bao mat

- Access token chi dung de xac minh danh tinh; service-role key chi ton tai o backend.
- Khong fallback service-role sang publishable key.
- CORS allowlist, body limit, security headers va request ID ap dung toan API.
- API response dung allowlist, khong `select=*` tren `users`.
- SAML SSO la cau hinh ha tang rieng; chi kich hoat sau khi co IdP/domain va goi Supabase phu hop.

## Ke hoach kiem thu

- Unit: dem tu, validation, quyen, last super admin, approval separation, error mapping.
- Integration: router + fake repository, cac ma HTTP va payload.
- Security: khong token, password/OTP; operator/member bi 403; malformed JSON/body qua lon bi tu choi.
- E2E: UI load/filter/modal va xu ly 409 tren trinh duyet.
- Remote smoke: chi chay sau khi migration duoc apply va co service-role key test/staging.

