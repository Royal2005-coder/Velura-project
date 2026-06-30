# Velura Admin RBAC Rules

## Role Matrix

| Role code | Default pages | Main modules |
| --- | --- | --- |
| super_admin | all admin pages | all modules |
| product_admin | dashboard, products | products, categories, inventory |
| order_admin | dashboard, orders | orders, payments, shipments |
| pricing_admin | dashboard, pricing, promotions | pricing, promotions, vouchers, bundles, budgets |
| review_admin | dashboard, reviews | reviews, support_tickets |
| service_admin | dashboard, returns-cskh | returns, support_tickets, orders read/update support fields |
| read_only_admin | dashboard, logs | dashboard, audit_logs read-only |
| member | welcome | no admin modules |

## Access Rules

1. The backend is the authority for RBAC. Client-side menu hiding is only presentation.
2. `profiles.status` must be `active` for admin access.
3. `read_only_admin` can read dashboards/logs but cannot mutate business data.
4. All admin create/update/delete/action requests must append an `audit_logs` record.
5. New accounts created by public registration must be assigned `member` unless a super admin changes them.
6. Escalation to `super_admin` should require a pending approval workflow before direct role assignment in production.

## Data Ownership

| Data | User owns | Admin handles |
| --- | --- | --- |
| profiles | own profile | lock, unlock, role assignment |
| orders | own order history | status, cancellation, payment exception |
| reviews | own review | moderation, reply, escalation |
| return_requests | own request | approval, refund, exchange, rejection |
| support_tickets | own ticket | assignment, response, close |
| promotions/vouchers | none | pricing admin controls |
| audit_logs | none | admin read-only |
