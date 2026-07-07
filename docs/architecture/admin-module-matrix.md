# Admin Backend Module Matrix

| Module | Canonical tables | RBAC owner | Versioned API | Production state |
| --- | --- | --- | --- | --- |
| A01 Accounts | `users`, `approval_admin_request`, `audit_log`, `email_outbox` | `super_admin` | `/api/v1/admin/accounts` | Schema verified; authenticated RPC tests pending |
| A02 Products/inventory | `product`, `variant`, `category`, `audit_log` | `admin_operator_sanpham`, `super_admin`; viewer reads | `/api/v1/admin/products` | Production schema/RLS read verifier passes; authenticated RPC tests pending |
| A03 Orders | `orders`, `order_item`, `order_status_history`, `payment` | `admin_operator_donhang`, `super_admin`; CSKH reads | `/api/v1/admin/orders` | Production migrations `003`/`004`, schema/RLS and database role matrix verified; JWT/E2E mutation tests pending |
| A04 Reviews | `review`, `support_ticket`, `audit_log` | `admin_operator_danhgia_review`, `super_admin` | not implemented | UI still uses `db.js`; do not release |
| A05 Returns/CSKH | `return_exchange`, `return_item`, `support_ticket`, `orders` | `admin_operator_cskh_dt`, `super_admin` | not implemented | UI still uses `db.js`; do not release |
| A06 Pricing/promotions | `price_history`, `promotion`, `voucher`, `promotion_product` | `admin_operator_gia_km`, `super_admin` | not implemented | UI still uses `db.js`; do not release |
| Dashboard/logs | shared read models, `audit_log` | role-scoped admins | dashboard only uses legacy route | Requires typed v1 read endpoints |

## Delivery order

1. Complete authenticated A02 sign-off, then deploy A03 migration to staging.
2. For each module: BA rules -> design -> migration/RLS/RPC -> service/repository/router -> UI adapter -> unit/security tests -> authenticated Supabase integration tests.
3. Remove the corresponding `db.js` dependency only when the versioned API is ready.
4. Keep `/api/admin/*` generic mutations disabled. A module is production-ready only through its typed `/api/v1/admin/*` contract.
