# Member / Guest flow — real-account phases

## Goal

Remove development Quick Test login and drive the storefront from real customer
authentication only. Guests can still browse and checkout through the guest OTP
flow, but Member-only UI requires a real token-backed session.

## Session contract

All successful customer authentication paths write the same browser keys:

- `velura_token`: required real API token.
- `velura_user`: serialized user profile.
- `userRole`: role used by conditional UI (`member` after customer login).
- `user_id`: stable customer identifier.

Logout and API `401` clear all four keys together. A session without
`velura_token` is treated as `guest`.

## Removed development login

The sign-in page no longer renders `Test Phone` or `Test Email`. There is no
`createDevMemberSession` helper and no local mock Member path.

## Phase 2 — Profile guest fallback

Guests may open `profile.html`. Personal fields render as `-`, profile actions
are disabled, and a blocking modal asks the user to sign in or leave for home.
Other account pages still require a real session.

## Phase 3 — Member-only product feature

The body-shape filter is locked for guests with `.member-lock-badge`. Clicking
the locked area sends the user to the signup page. Members with a Style Profile
continue to use the personalized filter.

## Phase 4 — Checkout split

Checkout uses `renderCheckoutLayout(role)` to route Members to saved-address
checkout and Guests to manual-address checkout. Guests see a confirmation modal
before the OTP/order flow continues. Members skip the guest confirmation modal.
