# Velura Admin DFD

```mermaid
flowchart LR
  User["Customer web"] --> API["apps/api"]
  Admin["Admin web"] --> API
  API --> Auth["Supabase Auth"]
  API --> DB["Supabase Postgres"]
  DB --> Profiles["profiles/app_roles/role_permissions"]
  DB --> Commerce["products/orders/order_items"]
  DB --> Service["reviews/returns/support_tickets"]
  DB --> Marketing["promotions/vouchers/bundles/budgets"]
  API --> Logs["audit_logs/email_outbox"]
```

Data-flow notes:

- User-web writes customer-owned commerce data.
- Admin-web reads the same rows and mutates workflow fields only through API actions.
- API enforces RBAC before any admin mutation.
- Supabase RLS remains enabled so direct browser access still respects ownership/admin policies.
