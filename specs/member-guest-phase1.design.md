# Member / Guest flow — Phase 1

## Goal

Make Quick Test login deterministic without touching the real authentication API or
the backend failed-login counter. Keep production authentication unchanged.

## Session contract

All successful authentication paths write the same four browser keys:

- `velura_token`: real API token when one exists.
- `velura_user`: serialized user profile.
- `userRole`: role used by conditional UI (`member` after customer login).
- `user_id`: stable customer identifier.

Logout and an API `401` clear all four keys together.

## Development-only Quick Test

`Test Phone` and `Test Email` are created only when `import.meta.env.DEV` is true.
Clicking either button creates a local Member test session and redirects to the
home page. It does not submit the sign-in form, call `/api/user/auth/signin`, use
a hard-coded password, merge a server cart, or mutate the backend attempt counter.

Production builds do not contain an executable Quick Test branch.

## Deferred phases

Profile guest fallback, member-only product filtering, and role-specific checkout
rendering remain intentionally unchanged until Phases 2–4.
