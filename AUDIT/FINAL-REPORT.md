# StudyHub hostile audit — final report

Date: 2026-09-07. Spec: `studyhub-plan/`. Scratch DB: `studyhub_audit` (created this session). Tests: `node AUDIT/tests/run-all.mjs` (needs `PGDATABASE=studyhub_audit`).

## What was broken

The plan described RLS, GiST, paise, and numbering, but **nothing was applied**. Vite SPA has no Nest API, so Playwright tenant-isolation against HTTP cannot exist yet. Seed P2 number clashes were already frozen in v1.1 docs. Remaining holes: `tenants` without RLS, no `studyhub_app` role, missing `student_requests` / `refresh_tokens` / `membership_pauses`, non-partial invoice/locker uniques, SET LOCAL pooling hazard unproven, concurrent GiST unproven, README still said `plan_doc/`.

## What is fixed (with tests)

| Cluster | Proof |
|---------|--------|
| Schema applied + FORCE + GiST | `p0-36-schema-catalog.mjs`, `p0-06-gist-overlap.mjs` |
| Concurrent double-book | `p0-42-concurrent-gist.mjs` — 1 insert / 1 exclusion |
| SET LOCAL vs session SET | `p0-01-set-local.mjs` |
| Super-admin not NULL `users.tenant_id` | `p0-03-superadmin.mjs` |
| Integer paise + FIFO ₹500 | `p0-05-money.mjs`, `p0-05-schema-money.mjs` |
| Tenants RLS + app role | `p0-40-tenants-rls.mjs` |
| Requests / refresh / pauses / partial uniques | `p1-0003-schema.mjs`, `p1-20-invoice-reuse.mjs` |
| Date math 31 Jan → 28 Feb | `p1-14-date-math.mjs` |
| Derived expiry / dual membership | `p1-15-status.mjs` |
| Renew today → superseded | `p1-17-renewal.mjs` |
| Locker overlap | `p1-21-locker.mjs` |
| 0003 rollback | Fresh `studyhub_audit_rb`: apply 05+0003, `0003_down.sql`, table gone, DB dropped |

**14/14 audit tests pass.** No Playwright/typecheck product suite exists — not skipped, **absent**.

## Still open, and why

| ID | Why |
|----|-----|
| **P2-32 / Q-01** | Closed: Vite+Fastify+Postgres. Nest deferred. Playwright HTTP isolation suite still absent. |
| **P0-37 / Q-05** | Firebase `apiKey` **removed from HEAD** (`447b89f`). Still in git history. Agent cannot rotate Google keys. **WONTFIX for agent; you must rotate.** |
| **P0-01 API half** | Fastify `withTenant` uses `set_config(..., true)` inside BEGIN/COMMIT. Playwright HTTP isolation suite still absent. |

## Honest timeline

The Vite app talks to Fastify on Postgres. Demo tenant persists. Nest+Next is deferred, not cancelled. WhatsApp/GST PDF/student app are not in tonight's desk.

## Three things most likely to break next

1. **Shipping without `studyhub_app`** — connecting as table owner/`postgres` bypasses FORCE RLS (superuser).
2. **Session `SET app.tenant_id`** (is_local=false) on a pooled connection — P0-01 leak mode.
3. **Prisma `db push`** dropping GiST `no_double_booking` / `no_double_locker`.

## Push

Pushed to **https://github.com/schoolxon/studyhub** (`origin`). Old GDG remote kept as `gdg-old`.
