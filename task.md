# Dashboard Fix — Tasks

- [x] **Fix backend dashboard route** — Pass `url.searchParams` to `buildDashboardSummary()` in `server.js:197`
- [x] **Add safeSelect wrapper** — Wrap `selectRows` calls in try-catch so one failing table doesn't crash the whole dashboard
- [x] **Add computed business fields** — Backend now returns `averageOrderValue`, `completionRate`, `range`, `from`, `to`
- [x] **Improve frontend error handling** — Better error messages with HTTP status, proper console logging
- [x] **Add Vietnamese number formatting** — `fmtNum` (locale) and `fmtMoney` (B/M/K abbreviations) utilities
- [x] **Use backend-computed KPI values** — Frontend uses `data.business.averageOrderValue` and `completionRate` directly
- [x] **Fix KPI card CSS** — Consistent padding, border-radius (`--radius-lg`), hover effect, skeleton loading animation
- [x] **Business KPI grid fix** — `.dashboard-kpi-grid--business` with consistent gap/responsive breakpoints
- [x] **Fix alert text typo** — "tồn tồn kho" → "tồn kho"
- [x] **Update API test assertions** — Updated `selectRows` → `safeSelect` pattern match
- [x] **API tests pass** — 91/91 ✓
- [x] **E2E tests pass** — Playwright test runner 41/41 ✓

## Return Status Transitions & Unified Modals (User Feedback)
- [x] **Returns Pencil Action & Modal** — Unified processing actions behind a single edit icon dropdown modal
- [x] **Support Tickets Pencil Action & Modal** — Integrated response/closure behind a single edit icon modal
- [x] **Service Role status transitions** — Direct state updates (e.g. shipping_back) bypassing PostgreSQL RLS
- [x] **Audit Logging** — Auto-writing transition records to the database `audit_log` table
- [x] **Returns & Tickets Seeder** — Populate test cases in Supabase using the new `seed-active-returns.mjs` seeder script
