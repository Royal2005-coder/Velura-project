# Velura Project

Velura is a fashion commerce workspace for customer web, admin web, shared backend API, Supabase/PostgreSQL database, and CI/CD deployment.

This repository is now the clean baseline for team development. The previous raw image collection under `categories/` is intentionally removed from source control. Product images used by the app must live in `src/assets/images` or in managed object storage later.

## Workspace

```text
Velura-project/
├── apps/
│   ├── api/             # Shared backend/API for admin and future user backend
│   ├── admin-web/       # Reserved boundary for admin app migration
│   └── user-web/        # Reserved boundary for customer app migration
├── packages/
│   ├── shared-types/    # Shared enums/constants
│   ├── utils/           # Shared helpers
│   └── validation/      # Shared validation helpers
├── database/
│   ├── migrations/      # Supabase/Postgres migrations
│   ├── seed/            # Reference/mock seed data
│   └── schema.sql
├── docs/
│   ├── business-rules/
│   ├── decision-tables/
│   └── process-flow/
├── infra/
│   ├── deploy/
│   ├── docker/
│   └── nginx/
├── src/                 # Current Vite admin/customer static UI
├── tests/
├── .github/workflows/
├── docker-compose.yml
├── package.json
└── vite.config.js
```

## Current Stack

- Node.js 20
- Vite static admin/customer pages
- Vanilla JavaScript modules for current admin prototype
- Node HTTP API in `apps/api`
- Supabase Auth + Supabase Postgres
- GitHub Actions for CI, staging gate, production gate
- Docker/Nginx baseline for admin web and Node API

## Local Setup

```bash
npm install
npm run dev
```

Admin UI opens at:

```text
http://localhost:5173/pages/admin/login.html
```

Run API locally:

```bash
copy .env.example .env
npm run api:dev
```

Healthcheck:

```text
http://localhost:8787/health
```

## Verification

```bash
npm run check:js
npm run build
npm run smoke:api
```

`npm run check` runs syntax checks and admin build.

## Database

Canonical schema:

```text
database/migrations/001_admin_backend_schema.sql
```

Seed/reference data:

```text
database/seed/001_reference_and_mock_data.sql
database/seed/seed-admin-users.mjs
```

Rules:

- Supabase tables are the source of truth.
- User and admin flows share the same data model.
- Admin actions must go through API/RBAC and write `audit_logs`.
- Never commit Supabase service-role keys or database passwords.

## Branching

- `main`: production baseline, protected.
- `develop`: staging/team integration.
- `feature/<scope>-<name>`: feature work.
- `fix/<scope>-<name>`: bug fixes.
- `chore/<scope>-<name>`: tooling/docs/cleanup.

## CI/CD

GitHub Actions:

- `.github/workflows/ci.yml`: syntax check, build, API smoke test.
- `.github/workflows/deploy-staging.yml`: staging gate from `develop`.
- `.github/workflows/deploy-production.yml`: manual production gate.

Production deployment must not be enabled until the team configures real cloud credentials, rollback, and monitoring.

## Team Rules

- Keep secrets out of Git.
- Keep raw/generated image collections out of Git.
- Add database changes as migrations.
- Keep user/admin backend contracts in `docs/business-rules` and `docs/process-flow`.
- Run `npm run check` before pushing.
- Use PRs into `develop`; promote to `main` only after staging QA.
