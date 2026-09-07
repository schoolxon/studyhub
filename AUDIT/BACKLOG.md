# StudyHub hostile audit — backlog

Canonical spec folder: `studyhub-plan/` (repo root). `05-Database-Schema.sql` is schema SoT.
Status values: `OPEN` | `IN_PROGRESS` | `FIXED` | `VERIFIED` | `WONTFIX`.

Evidence date: 2026-09-07. Code snapshot: Vite + React SPA (design-system shell) on disk; Nest/Prisma/Playwright **absent**. Scratch DB `studyhub_audit` created this session; `05` applied there.

---

## Counts

| Sev | Open | Verified | Wontfix | Total |
|-----|------|----------|---------|-------|
| P0  | 5    | 6        | 0       | 11    |
| P1  | 9    | 7        | 0       | 16    |
| P2  | 2    | 9        | 0       | 11    |
| P3  | 1    | 2        | 0       | 3     |

---

## P0 — tenant isolation / money / booking

| ID | Sev | Area | Description | Evidence | Status |
|----|-----|------|-------------|----------|--------|
| P0-01 | P0 | RLS | `SET LOCAL` / `set_config(..., true)` outside a transaction does not persist on a pooled connection. | Spec `04` § now requires `$transaction` + `set_config`. **No Nest/Prisma TenantContext exists.** Cannot prove pool leak until an API exists. | OPEN |
| P0-02 | P0 | RLS | `FORCE ROW LEVEL SECURITY` required; table owner bypasses ENABLE-only RLS. | Scratch `studyhub_audit`: `students.relforcerowsecurity = true`. Non-owner role still missing — **P0-41**. | VERIFIED |
| P0-03 | P0 | RLS | Super-admin `users.tenant_id IS NULL` breaks `tenant_id = current_setting(...)::uuid`. | `platform_admins` table now exists on `studyhub_audit`. No login/API test yet. | OPEN |
| P0-04 | P0 | RLS | Every tenant-bearing table needs a policy; child tables need `tenant_id` or parent-only access. | Applied DB: every `tenant_id` table has `relrowsecurity`. `invoice_items` included. `notification_templates` custom policy. `tenants` own-row (P0-40). Unfiltered SELECT under app role still needs P0-01 API. | VERIFIED |
| P0-05 | P0 | Money | All money must be BIGINT paise end-to-end. Any float is P0. | `05` money columns are `BIGINT`. Exception: `invoice_items.tax_rate NUMERIC(5,2)` is a **rate**, not money. **No API/DTOs.** Current UI (`src/pages/Home/Home.jsx`) displays `₹8,400` as a string — no paise contract. | OPEN |
| P0-06 | P0 | Booking | `no_double_booking` GiST must exist on the **applied** migration and reject concurrent duplicates. | Applied. Sequential overlap INSERT rejected. Two-connection race is **P0-42**. | VERIFIED |
| P0-36 | P0 | Schema | Schema SQL has never been applied to any database in this repo. All P0 DB guarantees are paper. | Created `studyhub_audit` this session; applied `05` with `ON_ERROR_STOP`. Catalog test PASS. Rollback: `AUDIT/migrations/0001_down.sql` or `DROP DATABASE studyhub_audit`. | VERIFIED |
| P0-37 | P0 | Secrets | Firebase web config (including `apiKey`) is in git history at `src/firebase/firebase.js`. | `git show HEAD:src/firebase/firebase.js` — `apiKey` present, project `library-seat-booking-sys-7f39b`. File deleted from working tree but still in HEAD. **Rotate / restrict API key.** Do not treat delete-from-disk as a fix. | OPEN |
| P0-40 | P0 | RLS | `tenants` table is not in the RLS loop. App role with table grants can list every library’s `owner_mobile`. | `0002_tenants_rls.sql` + test PASS: without GUC, `studyhub_app` count=0. | VERIFIED |
| P0-41 | P0 | RLS | `05` never `CREATE ROLE studyhub_app`. FORCE is untested as a non-owner, non-superuser. | Role exists, NOSUPERUSER NOBYPASSRLS, does not own `tenants`. | VERIFIED |
| P0-42 | P0 | Booking | Concurrent two-connection duplicate allocation not proven. | Sequential overlap PASS (`AUDIT/tests/p0-06-gist-overlap.mjs`). | OPEN |

---

## P1 — missing objects / logic

| ID | Sev | Area | Description | Evidence | Status |
|----|-----|------|-------------|----------|--------|
| P1-07 | P1 | Schema | `counters` for race-safe INV/RCP numbering. | Table present on `studyhub_audit`. No API uses it yet. | VERIFIED |
| P1-08 | P1 | Schema | `webhook_events` unique `(provider, event_id)`. | Table present on `studyhub_audit`. | VERIFIED |
| P1-09 | P1 | Schema | Overpayment → `student_advances`. | Table present on `studyhub_audit`. Allocation still unimplemented. | VERIFIED |
| P1-10 | P1 | Schema | `student_requests` for seat-change/pause/leave from student app. | `06` has `POST /student/requests`. **No `CREATE TABLE` in `05`.** | OPEN |
| P1-11 | P1 | Schema | `branches.code` for `INV/2627/AMB/0042`. | Column present on `studyhub_audit`. | VERIFIED |
| P1-12 | P1 | Schema | `students.preferred_language`, `notification_opt_out`. | Columns present on `studyhub_audit`. | VERIFIED |
| P1-13 | P1 | Auth | Refresh-token storage / revocation unspecified. | `06` `POST /auth/refresh`. `02` access 15m + refresh 30d. `04` mentions Redis JWT **blacklist** only — no table, no Redis key schema, no rotation/reuse detection. | OPEN |
| P1-14 | P1 | Logic | Date math 31 Jan + 1 month. | Spec frozen in `07` §: calendar month-end = 28/29 Feb, **not** addMonths−1. **No implementation / unit tests.** | OPEN |
| P1-15 | P1 | Logic | Expiry status must be derived from dates, not sparse cron paint. | `07` uses `days_left` range 1–7. `04` job table still says “Active→Expiring→Expired” as if cron writes status (`04` §7 `expiry-check`). Drift. | OPEN |
| P1-16 | P1 | Logic | `students.status` cannot represent two live memberships. | `02` §3.2: expiring/expired are membership-level. `students.status` still `active\|paused\|left\|blacklisted` (`05` L233) with no recompute function. | OPEN |
| P1-17 | P1 | Logic | Renew `start_from=today` must supersede, not expire-early. | `07` §8 frozen to `superseded`. No code. | OPEN |
| P1-18 | P1 | Logic | Pause hold-charge has no column; no pause history; `paused_days_total` unauditable. | `memberships.paused_days_total` exists (`05` L298). No `membership_pauses` table. `07` §4 still “chaho to hold charge” with no schema. | OPEN |
| P1-19 | P1 | Attendance | Unique `(student_id, date)` blocks lunch return / overnight. | Applied: `idx_att_open_session` on `check_out IS NULL`. No unique on date. | VERIFIED |
| P1-20 | P1 | Schema | Soft-delete vs unique: need partial indexes. | `seats (branch_id, seat_no)` and `students (tenant_id, student_code)` **are** partial `WHERE deleted_at IS NULL`. Remaining: `invoices UNIQUE (tenant_id, invoice_no)` is **not** partial; `lockers UNIQUE (branch_id, locker_no)` has no `deleted_at`. | OPEN |
| P1-21 | P1 | Lockers | No exclusion → two students one locker. | Constraint `no_double_locker` exists on `studyhub_audit`. No reject test yet. | OPEN |
| P1-22 | P1 | Perf | `v_seat_occupancy` seats×shifts CROSS JOIN. | Applied view has no CROSS JOIN. Cost at 500×4 unmeasured. | VERIFIED |

---

## P2 — spec contradictions / stack

| ID | Sev | Area | Description | Evidence | Status |
|----|-----|------|-------------|----------|--------|
| P2-23 | P2 | Forecast | Month-12 targets disagree. | `00` and `18` both: **127 paying / ₹1.05L MRR** base. `18` forbids 300/₹3L. | VERIFIED |
| P2-24 | P2 | Forecast | Break-even 25–30 vs 12/87/200. | `00` labels infra / +dev / full team. | VERIFIED |
| P2-25 | P2 | GTM | Pilot 6 months vs lifetime. | `00`/`01`/`README`: **5 × 6 months free**. | VERIFIED |
| P2-26 | P2 | Pricing | White-label ₹4,999 vs ₹999–2,999. | `14`/`00`/`11`: **₹4,999 + ₹15k**. | VERIFIED |
| P2-27 | P2 | Timeline | 10 weeks vs 14 vs 5–6 months. | Solo **16–20 weeks** + 4-week pilot; 10 weeks labeled 2-dev. | VERIFIED |
| P2-28 | P2 | Scope | Sprint 5 kitchen-sink. | `09`: Sprints 5–8 split (attendance / jobs / dashboard / SaaS). | VERIFIED |
| P2-29 | P2 | API | Duplicate mobile 409 vs warn. | `06`: `DUPLICATE_MOBILE` = 200 + warning, `force: true`. | VERIFIED |
| P2-30 | P2 | API | page/limit vs cursor. | `06`: Phase 1 page/limit only. | VERIFIED |
| P2-31 | P2 | Invoices | Display overdue vs enum. | `05`/`06`: derive from `due_date`; no enum value. | VERIFIED |
| P2-32 | P2 | Stack | Vite+Firebase vs Nest+Next+Prisma+Postgres. | Working tree: Vite React SPA + design system. HEAD still has Firebase client. Plan: greenfield Nest (`00`,`04`). **Human must choose.** See `DECISIONS.md` and `OPEN-QUESTIONS.md`. | OPEN |
| P2-38 | P2 | Docs | README still says canonical folder is `plan_doc/`. | Folder on disk is `studyhub-plan/`. `README.md` L9. | OPEN |

---

## P3 — infra

| ID | Sev | Area | Description | Evidence | Status |
|----|-----|------|-------------|----------|--------|
| P3-33 | P3 | Compose | `deploy.replicas` + dual bind `:3001`. | `16` now: 1 API year-1, no replicas, comment on Swarm. **No `docker-compose.prod.yml` file in repo.** | VERIFIED |
| P3-34 | P3 | Backup | `aws s3 cp` vs Cloudflare R2 needs `--endpoint-url`. | `16` backup snippet still `aws s3 cp` without endpoint, no R2 creds, no GPG key in Phase 0. | OPEN |
| P3-35 | P3 | Print | Thermal 58mm needs OS driver; ESC/POS is Phase 2. | `03` + `09` document Chrome `@page` + OS driver; ESC/POS optional. | VERIFIED |

---

## Not seed — related notes

- `.env.local` exists, is gitignored, **not** in git history. Local Postgres password lives there. Do not commit. If this machine is shared, rotate.
- `studyhub-plan.zip` is an untracked archive of docs; ignore as SoT.
- No Playwright / Jest / Vitest / Cypress configs on disk.
