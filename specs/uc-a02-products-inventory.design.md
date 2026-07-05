# Feature: UC-A02 Product And Inventory Administration

## Requirements

- While an active `admin_viewer`, product operator, or super admin is authenticated, when the catalog is opened, the system shall return paged products from canonical Supabase tables.
- While an active product operator or super admin is authenticated, when valid product data is submitted, the system shall create or update the product through an atomic PostgreSQL RPC.
- While a product is being changed concurrently, when `expectedVersion` is stale, the system shall reject the mutation with `VERSION_CONFLICT`.
- While stock is adjusted, when the resulting variant quantity would be negative, the system shall roll back the transaction.
- While a public customer browses products, the database shall expose only saleable product data and related variants/categories.

## Frontend

- `products.html` retains the existing catalog, form, status modal and drawer.
- `product-api.js` attaches the Supabase JWT and calls versioned endpoints only.
- Production starts with empty state and loads real API data; mock data requires explicit development configuration.
- Product/category/status filters, loading, empty and error states are rendered safely.
- All database text and URLs are encoded or validated before insertion into HTML.

## Backend

- Versioned endpoints cover list/detail/categories/variants/create/update/status/stock/audit/low-stock.
- Services validate UUIDs, enums, prices, URLs, array limits, reasons, integer stock deltas and optimistic versions.
- Repositories use explicit PostgREST projections and authenticated user JWTs.
- PostgreSQL RPCs repeat RBAC and business validation under row locks and append module-correct audit records.
- The legacy generic mutation API is disabled; each remaining admin module must migrate to a typed versioned router.

## Security

- Read access: active `admin_viewer`, product operator, or super admin.
- Mutation access: active product operator or super admin.
- Direct table mutation by browser roles is revoked; RPCs are the only mutation path.
- Mutation rate limiting is enforced by the API and all writes are audited.
- Product API responses use explicit projections and never expose unrelated internal columns.
- Production credentials are environment-only. Live mutation/hotfix scripts are disabled by default.

## Acceptance Tests

- RBAC permits expected roles and rejects members, inactive admins and unrelated operators.
- Invalid filters, UUIDs, prices, status transitions, reasons and stock deltas return `422`.
- Stale versions, duplicate SKU/slug and stock underflow return deterministic conflict/domain errors.
- Product UI source contains no direct Supabase table mutation or implicit mock fallback.
- Read-only Supabase verification confirms A02 columns before deployment; authenticated integration tests confirm RPC/RLS after deployment.
