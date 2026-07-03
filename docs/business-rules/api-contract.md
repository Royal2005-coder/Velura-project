# Admin API Contract

Base URL locally: `http://localhost:8787`.

Authentication:

- Send Supabase access token as `Authorization: Bearer <token>`.
- `GET /api/auth/me` returns profile, role and allowed pages.

Core endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | API healthcheck |
| GET | `/api/auth/me` | Current user/profile/RBAC |
| GET | `/api/admin/dashboard` | Operational and business dashboard |
| GET | `/api/admin/:resource` | List admin resource |
| POST | `/api/admin/:resource` | Create resource |
| PATCH | `/api/admin/:resource/:id` | Generic optimistic update |
| DELETE | `/api/admin/:resource/:id` | Delete resource when allowed |
| POST | `/api/admin/:resource/:id/actions` | Business action |

Supported resources:

`accounts`, `roles`, `products`, `categories`, `orders`, `order-items`, `reviews`, `returns`, `support-tickets`, `promotions`, `vouchers`, `bundles`, `budgets`, `logs`, `email-outbox`.

Action examples:

```json
{
  "action": "lock",
  "lockType": "temporary",
  "reason": "Repeated payment abuse investigation",
  "expectedVersion": 1
}
```

```json
{
  "action": "update-status",
  "status": "preparing",
  "reason": "Warehouse confirmed stock",
  "expectedVersion": 2
}
```

Optimistic locking:

- Send `expectedVersion` for mutations.
- `expectedVersion` is required for `PATCH` and action requests.
- API returns `409 VERSION_CONFLICT` if another admin updated the row first.
