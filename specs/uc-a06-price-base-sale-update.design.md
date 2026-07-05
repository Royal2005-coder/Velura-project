# Feature: UC-A06 Base And Sale Price Update

## Requirements

- While a pricing operator or super admin is authenticated, when they update a product price, the system shall accept both `newBasePrice` and `newSalePrice`.
- While a price update is submitted, when `newSalePrice` is higher than `newBasePrice`, the system shall reject the request before database mutation.
- While a price update succeeds, the system shall write `old_base_price`, `new_base_price`, `old_sale_price`, and `new_sale_price` to `price_history`.
- While anonymous users access Supabase, the system shall not expose `price_history` rows.

## Architecture

- Frontend: `apps/admin-web/src/scripts/pricing.js` renders a single price modal with current values, new base price, new sale price, live discount preview, and client-side validation.
- Backend: `apps/api/src/pricing/pricing-service.js` validates both prices, reason length, and optimistic version before calling the repository.
- Database: `database/migrations/008_uc_a06_base_sale_price_update.sql` replaces the old one-price RPC signature with a two-price signature and hardens `price_history` RLS.

## Security

- Auth is required by the API service and by the Supabase security-definer RPC actor lookup.
- Authorization is limited to `super_admin` and `admin_operator_gia_km`.
- Input validation runs in both API and RPC layers.
- `price_history` select is granted only to authenticated users and filtered by admin pricing roles.
- Audit logging records old and new base/sale values with the optimistic version.

## Verification

- `npm run test:api`
- `npm run build`
- `npm run check:js`
- `npm run verify:a06:supabase`
