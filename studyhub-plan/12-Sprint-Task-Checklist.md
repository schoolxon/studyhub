# 12 — Sprint Task Checklist (ticket-level)

Ye list seedha Jira/Linear/Notion me import kar sakte ho.
Format: `[EPIC] Task — estimate (hours)`

---

## EPIC 1: Infrastructure & Foundation (~60h)

- [ ] Monorepo setup (Turborepo: apps/api, apps/web, apps/mobile, packages/shared) — 4h
- [ ] NestJS scaffold + eslint + prettier + husky pre-commit — 3h
- [ ] Next.js scaffold + Tailwind + shadcn/ui init — 3h
- [ ] Docker Compose (postgres 16, redis 7, api, web) — 3h
- [ ] Prisma init + schema from SQL file — 6h
- [ ] Migration + seed scripts (plans, default templates, expense categories) — 4h
- [ ] Env config module with validation (zod) — 2h
- [ ] Structured logger (pino) with request_id correlation — 3h
- [ ] Global exception filter + error code enum — 3h
- [ ] Response transform interceptor (envelope) — 2h
- [ ] Health check endpoint (/health, /health/db, /health/redis) — 2h
- [ ] GitHub Actions: lint + typecheck + unit test on PR — 4h
- [ ] GitHub Actions: build + deploy to staging on merge — 4h
- [ ] Sentry integration (api + web) — 3h
- [ ] PostHog integration (web) — 2h
- [ ] Rate limiting middleware (Redis based) — 4h
- [ ] Cloudflare R2 storage service (upload, signed URL, delete) — 5h
- [ ] BullMQ setup + separate worker process — 5h

## EPIC 2: Multi-tenancy & Auth (~50h)

- [ ] TenantContext: **`set_config(..., true)` inside `$transaction` only** — 8h
- [ ] RLS ENABLE + **FORCE** + non-owner `studyhub_app` role — 4h
- [ ] `platform_admins` (super admin NULL tenant_id nahi) — 3h
- [ ] Prisma middleware auto-inject tenantId — 5h
- [ ] RLS policies migration — 4h
- [ ] Non-superuser DB role + grants — 2h
- [ ] **Cross-tenant isolation test suite (every endpoint)** — 8h
- [ ] OTP service (generate, hash, store, verify, rate limit) — 5h
- [ ] SMS provider adapter (MSG91) + DLT templates — 5h
- [ ] Signup endpoint + tenant creation + trial subscription — 5h
- [ ] Login (OTP + password) + JWT issue — 4h
- [ ] Refresh token rotation + revocation list — 4h
- [ ] RolesGuard + @Roles decorator + permission matrix — 5h
- [ ] Password reset flow — 3h

## EPIC 3: Onboarding & Setup (~45h)

- [ ] Branches CRUD (api) — 4h
- [ ] Shifts CRUD with overnight/full-day flags — 5h
- [ ] Seats CRUD — 4h
- [ ] Seats bulk generate endpoint — 3h
- [ ] Fee plans CRUD — 4h
- [ ] Onboarding status + step endpoints — 3h
- [ ] Settings module (get/patch, logo upload) — 4h
- [ ] Wizard UI step 1: library details — 3h
- [ ] Wizard UI step 2: shifts (with presets) — 4h
- [ ] Wizard UI step 3: seats bulk generator — 4h
- [ ] Wizard UI step 4: fee plans — 4h
- [ ] Wizard UI step 5: first student — 3h

## EPIC 4: Seat Map (~40h)

- [ ] Seat availability query with exclusion constraint logic — 6h
- [ ] Seat map endpoint (per-shift occupancy aggregation) — 6h
- [ ] SeatMap React component (grid, responsive) — 8h
- [ ] Color legend + status states — 3h
- [ ] Shift filter chips — 3h
- [ ] Seat detail popover (student, expiry, due, actions) — 5h
- [ ] Seat status change (block/maintenance) — 3h
- [ ] Drag-to-arrange layout editor (P1, optional) — 6h

## EPIC 5: Students (~55h)

- [ ] Students CRUD + soft delete — 6h
- [ ] Search (pg_trgm) + filters + pagination — 6h
- [ ] Student code auto-generation — 2h
- [ ] Photo upload with client-side compression — 5h
- [ ] Documents upload (ID proof) with sensitivity flag — 4h
- [ ] QR token generation + regeneration — 3h
- [ ] Student timeline aggregation endpoint — 5h
- [ ] Duplicate mobile warning logic — 2h
- [ ] Student list UI (mobile cards / desktop table) — 8h
- [ ] Student add/edit form + camera capture — 8h
- [ ] Student profile page with 6 tabs — 8h
- [ ] CSV/Excel import with column mapping + validation preview — 10h
- [ ] Student export to Excel — 3h

## EPIC 6: Memberships (~60h)

- [ ] Date calculation utils (calendar month, days, month-end clamp) — 4h
- [ ] Membership create transactional service — 10h
- [ ] Seat allocation service (incl. full-day multi-shift) — 8h
- [ ] Renewal service (expiry vs today start) — 6h
- [ ] Seat/shift change with price diff calculation — 8h
- [ ] Pause/resume with day extension + overlap check — 8h
- [ ] Leave + deposit settlement service — 8h
- [ ] Expiring memberships query — 3h
- [ ] Admission multi-step UI — 12h
- [ ] Renewal modal UI — 5h
- [ ] Seat change modal UI — 5h
- [ ] Pause/resume UI — 4h
- [ ] Leave/settlement UI with refund calculation — 6h

## EPIC 7: Billing & Payments (~55h)

- [ ] Race-safe invoice/receipt number counter — 5h
- [ ] Invoice create + items — 5h
- [ ] Payment create with FIFO allocation — 8h
- [ ] Payment reversal (owner only, audit) — 4h
- [ ] Deposits ledger service — 5h
- [ ] Discount with staff limit validation — 4h
- [ ] Dues query with aging buckets — 5h
- [ ] Receipt PDF template (A4 + 58mm thermal) — 8h
- [ ] PDF generation service (Puppeteer, queued) — 6h
- [ ] Receipt WhatsApp send — 3h
- [ ] Collect payment modal (3-tap) — 6h
- [ ] Due students screen + bulk select + bulk remind — 6h
- [ ] Payment history + filters — 4h
- [ ] Receipt preview + print — 4h

## EPIC 8: Attendance (~35h)

- [ ] Attendance scan endpoint (in/out/bounce/re-entry) — 6h
- [ ] Manual attendance endpoint — 3h
- [ ] Auto-checkout cron job — 4h
- [ ] Attendance queries (daily, student monthly, absent) — 5h
- [ ] Attendance reports + Excel export — 4h
- [ ] QR scanner page (html5-qrcode, fullscreen, kiosk mode) — 8h
- [ ] Today's attendance UI + manual marking — 5h
- [ ] Student attendance history view + graph — 5h
- [ ] Printable student ID card with QR — 4h

## EPIC 9: Notifications (~50h)

- [ ] Notification template model + seed defaults (en + hi) — 5h
- [ ] WhatsApp provider adapter (AiSensy/Meta) — 8h
- [ ] SMS provider adapter — 4h
- [ ] Notification service with dedupe + credit check + logging — 8h
- [ ] Credits ledger + balance + topup — 5h
- [ ] Cron: expiry-check + status transitions — 5h
- [ ] Cron: fee-reminder (5d, 0d, +3d, +7d) — 5h
- [ ] Cron: daily-summary to owner — 4h
- [ ] Cron: absent-alert — 3h
- [ ] Bulk broadcast endpoint with audience filters — 5h
- [ ] Notification settings UI (toggles) — 4h
- [ ] Template editor UI with variable preview — 5h
- [ ] Broadcast composer UI with recipient count + credit cost — 5h
- [ ] Notification log viewer — 4h

## EPIC 10: Expenses & Reports (~45h)

- [ ] Expense categories + expenses CRUD — 5h
- [ ] Bill photo upload — 3h
- [ ] Dashboard KPI aggregation (cached) — 8h
- [ ] Report: collection (day/mode/staff grouping) — 5h
- [ ] Report: dues with aging — 3h
- [ ] Report: admissions + churn — 4h
- [ ] Report: attendance summary — 3h
- [ ] Report: expenses by category — 3h
- [ ] Report: P&L — 5h
- [ ] Report: occupancy by shift — 4h
- [ ] Report: discounts + deposit ledger — 4h
- [ ] Excel export service (exceljs) — 5h
- [ ] PDF export service — 4h
- [ ] Dashboard UI with cards + recharts — 10h
- [ ] Reports hub UI with date range picker — 8h
- [ ] Expenses UI — 5h

## EPIC 11: Staff, Audit, Settings (~30h)

- [ ] Staff CRUD + permission assignment — 6h
- [ ] Activity log interceptor (auto-capture writes) — 6h
- [ ] Activity log query + filters — 4h
- [ ] Settings pages (8 sub-pages) — 10h
- [ ] Full data export endpoint — 5h
- [ ] i18n: extract all strings + Hindi translation — 12h

## EPIC 12: SaaS Layer (~40h)

- [ ] Subscription model + trial creation on signup — 5h
- [ ] Plan limit enforcement guard (students, branches, staff, credits) — 6h
- [ ] Trial expiry cron + reminder emails/WhatsApp — 5h
- [ ] Upgrade flow + Razorpay subscription — 8h
- [ ] Dunning cron (retry + suspend) — 5h
- [ ] Read-only suspended mode — 4h
- [ ] Billing page UI + plan comparison — 6h
- [ ] Upgrade prompts at limit boundaries — 4h
- [ ] Super admin: tenant list + detail + metrics — 8h
- [ ] Super admin: impersonation with audit — 4h

## EPIC 13: QA, Security, Launch (~40h)

- [ ] Unit tests for business logic (proration, dates, allocation, payment split) — 12h
- [ ] Integration tests for critical flows (admission, payment, renewal) — 10h
- [ ] E2E tests (Playwright): signup → setup → admission → payment — 8h
- [ ] Load test with k6 (100 concurrent) — 4h
- [ ] Security: npm audit, Trivy scan, headers, CORS, CSP — 5h
- [ ] Backup script + restore drill documented — 4h
- [ ] Monitoring: uptime, error rate alerts, queue depth alert — 5h
- [ ] Production deploy runbook — 3h
- [ ] Pilot data migration scripts — 6h

---

## Total estimate

| Phase | Hours | Solo 40h/wk | 2 devs |
|---|---|---|---|
| Pilot-ready (Sprints 1–7) | ~550h | ~14 weeks | ~8 weeks |
| Launch harden (Sprint 8) | ~80h | +2 weeks | +1 week |
| **Phase 1 total** | **~630h** | **16 weeks** | **~10 weeks** |
| Buffer 25% (bugs, DLT delay) | — | **up to 20 weeks** | ~12 weeks |
| Phase 2 | ~400h | ~10 weeks | ~6 weeks |

`00` ka purana “10 weeks MVP” 2-dev best case hai. Solo default = **16–20 weeks**
build+buffer, phir 4-week pilot — `19` ke 5–6 months se match.

Definition of Done (har ticket ke liye) — tenant isolation: request **andar**
`$transaction` + `set_config`; FORCE RLS wale role se test.

---

## Definition of Done (har ticket ke liye)

- [ ] Code likha aur self-reviewed
- [ ] TypeScript strict — koi `any` nahi
- [ ] Tenant isolation verified (agar data touch karta hai)
- [ ] Unit test (business logic) ya integration test (endpoint)
- [ ] Error cases handle (network fail, empty state, permission denied)
- [ ] Mobile pe test kiya
- [ ] Hindi strings added
- [ ] Loading + error + empty states
- [ ] PR review + merge
- [ ] Staging pe verify
