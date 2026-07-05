# Feature: UC-A03 Order Operations

## Requirements

- While an active order operator, CSKH operator or super admin is authenticated, when an authorized order view opens, the system shall return only the safe order projection allowed by RBAC.
- While an active order operator or super admin submits a valid transition, the system shall update the order, append status history and audit the action in one transaction.
- While a cancellable order is cancelled, the system shall restore variant stock, update any paid transaction to `refund_pending`, append history/audit and enqueue customer notification atomically.
- While a payment is `failed` or `discrepancy`, when an authorized admin resolves it with current versions, the system shall record the resolution without deleting payment history.
- While another admin has changed an order/payment, when a stale version is submitted, the system shall reject the operation with a conflict.

## Canonical Data

- `orders`: order header, shipping snapshot, totals, status, tracking and internal note.
- `order_item`: immutable purchased item/price snapshot linked to `variant`.
- `order_status_history`: append-only status transitions and manual reason.
- `payment`: append-only payment attempts; resolution updates status/refund fields with versioning.
- `variant`: stock restored by an approved cancellation.
- `audit_log`, `email_outbox`: transactional audit and customer notification.

## Status Model

```text
pending -> confirmed | cancelled
confirmed -> preparing | cancelled
preparing -> shipping | cancelled
shipping -> delivered | failed_delivery
failed_delivery -> shipping | cancelled
delivered -> completed
completed -> terminal
cancelled -> terminal
```

`shipping` requires a tracking code. `delivered` records `delivered_at`. Terminal statuses reject manual changes.

## Frontend

- Keep the existing dense operational order page, tabs, drawer and action modals.
- Replace `db.js` with `order-api.js`; production starts empty and loads Supabase data only.
- Render loading, empty, error and stale-version states.
- Encode every customer/order/payment value inserted into HTML.
- Derive available transitions from the canonical matrix and send reason/tracking/version.
- Export only the currently filtered safe projection.

## Backend

- Versioned endpoints: list/detail/history/audit, change status, cancel and resolve payment.
- Service validates UUID, statuses, transition, reason, tracking code, payment decision, versions and filters.
- Repository uses explicit PostgREST projections with the caller JWT and RPCs for mutations.
- PostgreSQL repeats active-role checks and locks affected rows before validation.
- Cancellation locks order/variants/payment and applies all side effects atomically.

## Security

- Read: `super_admin`, `admin_operator_donhang`, `admin_operator_cskh_dt`.
- Mutate: `super_admin`, `admin_operator_donhang`.
- Member reads only their own order graph under RLS; no admin page is granted.
- Direct authenticated updates/deletes are revoked from order/payment/history tables.
- Payment response excludes provider secrets and raw card data.
- API mutation rate limiting and audit logging apply to every action.

## Acceptance Tests

- Correct role matrix and inactive/member denial.
- Valid/invalid status transitions, terminal state and tracking requirement.
- Cancellation stock restoration, refund-pending decision and optimistic conflict.
- Payment resolution validation and stale order/payment versions.
- Safe projections contain no credential/card fields.
- UI source has no `db.js`, direct PostgREST access or unescaped database rendering.
- Production verifier confirms A03 version columns and read policies before release.
