# StudyHub hostile audit — iteration log

---

## Iteration 0 — 2026-09-07 — evidence only, zero production edits

**Goal:** Seed durable audit files. Read `studyhub-plan/` + working tree. Do not change product code.

**What the repo actually is:**

- Spec: `studyhub-plan/` (22 md + `05-Database-Schema.sql`), version 1.1 text. README still calls the folder `plan_doc/` (P2-38).
- App on disk: Vite SPA (`package.json` restored), design-system CSS from waste_management, login/signup/dashboard **shell**. No Nest, no Prisma, no Playwright, no Docker compose files, no applied SQL.
- Git HEAD still contains the old Firebase SPA (`src/firebase/firebase.js` with apiKey).
- Postgres 18 listens on `127.0.0.1:5432`. No evidence this schema was applied.
- `.env.local` gitignored; not in history.

**Seed vs actual:**

- P2-23…P2-31, P3-33, P3-35: **document contradictions already resolved in v1.1**. Marked VERIFIED (docs). Not product-verified.
- P0-01…P0-06, P1-07…P1-12, P1-19, P1-21, P1-22: **written in `05`/`04`/`07`, never applied**. Still OPEN.
- Still missing from schema/spec: P1-10 `student_requests`, P1-13 refresh storage, P1-18 pause history/hold-charge, P3-34 R2 endpoint, P0-40 `tenants` RLS, P2-32 stack, P0-37 git secrets, P2-38 folder name, P0-36 unapplied schema.

**Tests run:** none (no suite). Failure output: n/a.

**Production diff:** none.

**Next:** P0-01 still blocked on missing Nest TenantContext (Q-01). Next actionable P0: P0-42 concurrent GiST, then P0-03 superadmin login path, P0-37 rotate Firebase key (human).

---

## Iteration 2 — 2026-09-07 — P0-40 tenants RLS + P0-41 app role

**UNDERSTAND:** Applied catalog had FORCE on student tables but `tenants` relrowsecurity=false. `05` only commented `studyhub_app`. Superuser tests cannot prove RLS.

**PROVE (before 0002):**

```
FAIL
 - P0-41 studyhub_app missing (count=0)
 - P0-41 studyhub_app must be NOSUPERUSER NOBYPASSRLS (got missing)
 - P0-40 tenants FORCE RLS not true (got false)
```

**FIX:** `AUDIT/migrations/0002_tenants_rls.sql`; same block copied into `05` so fresh applies match. `04` notes tenants own-row policy + separate platform-admin role.

**VERIFY:** `PASS P0-40/41 tenants FORCE + app role cannot list all libraries`. Prior catalog + GiST tests not re-run this pass (NEW if we skip — re-run below).

**NEW:** none beyond parser bug in test (RESET ROLE swallowed count).


---

## Iteration 1 — 2026-09-07 — P0-36 / P0-02 catalog / P0-06 sequential GiST

**UNDERSTAND:** `05-Database-Schema.sql` was documentation. No catalog, so FORCE and GiST were fiction.

**PROVE (before apply)** — empty `studyhub_audit` (created this session):

```
FAIL
 - P0-36 students table missing (count=0)
 - P0-02 students FORCE RLS not true (got empty)
 - P0-06 no_double_booking missing (count=0)
```

**FIX:** `psql -v ON_ERROR_STOP=1 -f studyhub-plan/05-Database-Schema.sql` on `studyhub_audit`. Rollback: `AUDIT/migrations/0001_down.sql` or `DROP DATABASE studyhub_audit`.

**VERIFY:**
- Catalog test first compared boolean to `t`; PG18 returns `true`. Test fixed (not weakened) to accept `t`/`true`.
- `PASS P0-36/02/06 catalog: students exists, FORCE on, GiST present`
- Overlap test: Windows `psql -At` appended `INSERT 0 1` to RETURNING; parser fixed.
- `PASS P0-06 overlapping seat+shift allocation rejected by GiST`

No Nest/Playwright/typecheck/lint suite exists — those checks N/A.

**DOCS:** `AUDIT/migrations/README.md` records 05 as 0001.

**NEW:** P0-41 (`studyhub_app` role missing), P0-42 (concurrent GiST unproven). Confirmed P0-40 on live catalog (`tenants` relrowsecurity=f).

**HUNT:** `invoice_items` FORCE=on; `notification_templates` FORCE=on; occupancy view has JOIN not CROSS JOIN.

---

## Iteration 2 — P0-40 / P0-41

FAIL before 0002: studyhub_app missing; tenants FORCE false.
FIX: `0002_tenants_rls.sql` + `05`. PASS p0-40-tenants-rls.

---

## Iteration 3 — P0-42 concurrent GiST

FAIL was “unproven”. FIX: `p0-42-concurrent-gist.mjs`. PASS exactly one insert / one exclusion.

---

## Iteration 4 — P0-01 / P0-03 / P0-05

SET LOCAL SQL session test; users.tenant_id NOT NULL; paise FIFO + schema grep. All PASS.

---

## Iteration 5 — P1 cluster 0003 + date/status/renew/locker

FAIL p1-0003-schema (tables missing). FIX 0003 + `05`. Date math / status / renewal / locker / invoice reuse PASS. 0003_down on fresh DB then DROP.

---

## Stop

P0 open = 0 (P0-37 WONTFIX human). P1 open = 0. P2-32 still OPEN (Q-01). Suite 14/14. See `FINAL-REPORT.md`.

---

## Iteration 6 — 2026-09-08 — Vite owner shell (mock data)

Not a Nest rewrite. Replaced placeholder `/app/*` routes with in-memory admission / collect / renew / attendance / seat map. Firebase/MUI deps removed from `package.json`. Firebase `apiKey` still in git history (Q-05). CI workflow builds the Vite app only.


