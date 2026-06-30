# Velura Admin Backend Process Flow

This document is the business-process source for the admin backend. The current admin UI can keep its static pages while each module is migrated from localStorage to the API/database contract below.

## 1. Account And RBAC Flow

```mermaid
flowchart TD
  A["User signs in via Supabase Auth"] --> B["API loads profile and role"]
  B --> C{"Is admin role active?"}
  C -- "No" --> D["Return welcome-only access"]
  C -- "Yes" --> E["Resolve role_permissions"]
  E --> F["Return allowed admin pages"]
  F --> G["Admin opens permitted module"]
  G --> H["API checks module/action permission"]
  H --> I["Read or mutate shared database"]
  I --> J["Write audit_logs"]
```

Business rules:

- A new user defaults to `member` and only receives the `welcome` page.
- Admin pages are derived from `app_roles` and `role_permissions`.
- Every admin mutation writes an `audit_logs` row.
- Locking the last active `super_admin` must be blocked in the UI and API extension layer.

## 2. Order Operations Flow

```mermaid
flowchart TD
  U["Customer creates order"] --> O["orders + order_items"]
  O --> P{"Payment status"}
  P -- "paid" --> A["Order admin confirms/prepares"]
  P -- "error" --> R["Order admin resolves payment"]
  A --> S["Shipping"]
  S --> C["Completed"]
  A --> X{"Cancel requested?"}
  X -- "Yes" --> Y["Validate transition"]
  Y --> Z["Cancel order, restock, create refund status"]
  Z --> L["Audit log + email_outbox"]
```

Valid order transitions:

| From | To |
| --- | --- |
| pending | confirmed, held, cancelled |
| confirmed | preparing, held, cancelled |
| preparing | shipping, held |
| shipping | completed, held |
| held | confirmed, preparing, cancelled |
| completed | none |
| cancelled | none |

## 3. Review And CSKH Flow

```mermaid
flowchart TD
  A["Customer submits review"] --> B["reviews.status = pending"]
  B --> C{"Rating or keyword risk?"}
  C -- "Normal" --> D["Review admin approve/reply/hide"]
  C -- "Urgent" --> E["Create support ticket"]
  E --> F["CSKH handles ticket"]
  D --> G["Audit log"]
  F --> G
```

Rules:

- Reviews rated 1-2 stars should be flagged `urgent` or `negative`.
- A review can be approved, hidden, replied to, or escalated into `support_tickets`.
- Customer-visible replies stay in `reviews.admin_response`.

## 4. Return/Exchange Flow

```mermaid
flowchart TD
  A["Customer requests return/exchange"] --> B["return_requests.deadline_at = created + 48h"]
  B --> C{"Within 48h?"}
  C -- "No" --> D["Expire request"]
  C -- "Yes" --> E["Service admin reviews evidence"]
  E --> F{"Decision"}
  F -- "Approve refund" --> G["status = refunded"]
  F -- "Approve exchange" --> H["status = exchanged, create replacement order"]
  F -- "Reject" --> I["status = rejected"]
  G --> J["Audit log + email_outbox"]
  H --> J
  I --> J
```

## 5. Promotion Flow

```mermaid
flowchart TD
  A["Pricing admin creates promotion"] --> B["Attach vouchers/products/budget"]
  B --> C{"Budget >= used?"}
  C -- "No" --> D["Auto stop or warning"]
  C -- "Yes" --> E["Promotion active in checkout"]
  E --> F["Orders consume voucher and budget"]
  F --> G["Dashboard tracks campaign effect"]
```

Rules:

- Voucher codes are globally unique.
- Budget usage is stored in `promotion_budgets.used_amount`.
- When budget reaches limit, promotion status should move to `stopped` or `warning` depending on decision table.
