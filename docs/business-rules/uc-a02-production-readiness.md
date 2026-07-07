# UC-A02 Production Readiness

## Implemented in source

- Typed product/catalog/inventory API under `/api/v1/admin/products`.
- Canonical singular tables: `product`, `variant`, `category`, `audit_log`.
- Product viewer and mutation RBAC, optimistic locking, status transition rules and stock-underflow prevention.
- Explicit projections, validated filters/UUIDs/prices/URLs/arrays, CSV preview parser and module-correct audit logging.
- Public read policy for saleable catalog data and RPC-only admin mutations.
- Admin product UI loads Supabase data through the backend and supports create/update/status/variant stock workflows.
- Legacy generic admin mutation endpoints are disabled.

## Deployment gate

As of 2026-07-02, production does not contain `product.version` or `variant.version`; UC-A02 is therefore not deployed.

1. Rotate the Supabase Management token, service key and PostgreSQL password that were previously embedded in local scripts.
2. Configure replacement secrets outside Git.
3. Apply `database/migrations/002_uc_a02_products_inventory.sql` through an approved migration identity.
4. Run `npm run verify:a02:supabase`.
5. Run authenticated tests with `admin_viewer`, `admin_operator_sanpham`, unrelated operator, member and inactive-admin tokens.

Do not deploy the admin product UI before the migration and authenticated RBAC/RPC tests pass.
