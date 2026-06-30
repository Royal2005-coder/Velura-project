# Velura Engineering Skill Manifest

This file is the project-level guide for AI agents and team members working in Velura.

## Mission

Build Velura as a maintainable fashion commerce platform with:

- Shared Supabase/Postgres data model.
- Admin backend first, user backend next.
- Clear RBAC and audit trail.
- Clean monorepo boundaries.
- CI/CD through staging before production.

## Source Of Truth

Read in this order before implementing:

1. `README.md`
2. `docs/business-rules/admin-rbac.md`
3. `docs/business-rules/api-contract.md`
4. `docs/process-flow/admin-backend-bpmn.md`
5. `docs/process-flow/erd.md`
6. `database/migrations/001_admin_backend_schema.sql`

## Architecture Rules

- `apps/api` owns backend API and RBAC enforcement.
- `database/migrations` owns schema changes.
- `packages/shared-types`, `packages/validation`, and `packages/utils` hold reusable logic.
- Current admin/customer pages remain in `src/pages` until migrated into app-specific frontends.
- Do not reintroduce `categories/` or other raw image dumps into Git.
- Product media should use `src/assets/images` for bundled assets or object storage later.

## Security Rules

- Do not trust client-side RBAC.
- Every admin mutation must validate auth, permission, input, and expected row version.
- Do not expose password, token, service role, or connection string values.
- Write business mutations to `audit_logs`.
- Keep `.env` local only; commit `.env.example` only.

## Development Rules

- Prefer small, reviewable changes.
- Do not rewrite unrelated files.
- Add migrations instead of editing applied database history.
- Keep user and admin flows on shared tables.
- Run `npm run check` before handoff.

## Git Rules

- Work on `feature/*`, `fix/*`, or `chore/*`.
- Merge team work into `develop`.
- Promote `develop` to `main` after staging QA.
- Production deploy requires manual approval and rollback plan.

## Definition Of Done

- Code builds.
- API syntax checks pass.
- Schema/data contract documented if changed.
- No secrets committed.
- No raw image dump committed.
- Relevant business rule or process doc updated.
