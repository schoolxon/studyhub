# 09 — PHASE 1: MVP Build (Week 3–18, **16 weeks**)

**Goal:** Ek working product jo **5** pilot libraries roz use karein.
**Solo timeline:** 16 weeks build + 4 weeks pilot ≈ **5–6 months** idea se paid
launch — `19` se match. 2 devs hon to ~10–12 weeks build.

**MVP ki definition:** Owner apna register phenk sake. Bas itna.

v1.0 ka “Sprint 5 = Week 11 me sab kuch” galat tha. Neeche 4 sprints me toda hai.

---

## Sprint 1 (Week 3-4) — Foundation

### Backend
- [ ] NestJS project scaffold, TypeScript strict mode
- [ ] Prisma: `05` se **raw SQL migrations** (GiST EXCLUDE Prisma schema me nahi);
      `schema.prisma` introspect, `db push` se exclusion drop mat karo
- [ ] Migration system, seed script
- [ ] Multi-tenancy: **har request `$transaction` + `set_config(..., true)`**;
      RLS `ENABLE` + `FORCE`; cross-tenant isolation suite in CI
- [ ] Auth module: signup, OTP send/verify, login, JWT + refresh
- [ ] RolesGuard + permission decorator
- [ ] Global exception filter, response transform interceptor
- [ ] Health endpoint, structured logging (pino) with request_id
- [ ] **Cross-tenant isolation test suite** (Tenant A → Tenant B resource = 404)

### Frontend
- [ ] Next.js scaffold, Tailwind + shadcn/ui
- [ ] Design tokens (colors, typography, spacing)
- [ ] Layout shell: sidebar (desktop) + bottom nav (mobile)
- [ ] Auth pages: login, signup, OTP verify
- [ ] API client with token refresh interceptor
- [ ] i18n setup (en/hi JSON files) — har string key se aaye, hardcode nahi
- [ ] Protected route wrapper

### DevOps
- [ ] Docker Compose (postgres, redis, api, web)
- [ ] GitHub Actions: lint, typecheck, test, build
- [ ] Staging server deploy

**Sprint 1 done = koi signup karke login kar sakta hai.**

---

## Sprint 2 (Week 5-6) — Setup & Seats

### Backend
- [ ] Branches CRUD
- [ ] Shifts CRUD (overnight + full-day handling)
- [ ] Seats CRUD + bulk generate
- [ ] Seat availability query (exclusion constraint wali logic)
- [ ] Seat map endpoint (grid + occupancy per shift)
- [ ] Fee plans CRUD
- [ ] Onboarding wizard endpoints
- [ ] Settings module

### Frontend
- [ ] 5-step setup wizard
- [ ] Branch/shift/fee-plan management screens
- [ ] **Seat map component** — grid, color-coded, shift filter, click → detail
- [ ] Bulk seat generator UI
- [ ] Settings pages

**Sprint 2 done = naya owner 15 min me apni library setup kar sakta hai.**

---

## Sprint 3 (Week 7-8) — Students & Admission (CORE)

### Backend
- [ ] Students CRUD + search (trigram) + filters + pagination
- [ ] Photo upload → R2, compress, signed URL
- [ ] Student status state machine
- [ ] **Membership creation (transactional):** student + membership + seat_allocation +
      invoice + payment ek transaction me
- [ ] Renewal endpoint
- [ ] Seat/shift change endpoint
- [ ] Pause/resume endpoint
- [ ] Leave + deposit settlement endpoint
- [ ] Invoice number generator (race-safe counter)
- [ ] Student timeline endpoint

### Frontend
- [ ] Student list (search-first, cards on mobile, table on desktop)
- [ ] Student add/edit form with camera photo capture
- [ ] Student profile page with tabs
- [ ] **New Admission multi-step flow** (`03-User-Flows` FLOW 1)
- [ ] Renewal modal
- [ ] Seat change modal
- [ ] Leave/settlement modal

**Sprint 3 done = admission ho sakta hai. Ye sabse bada sprint hai.**

---

## Sprint 4 (Week 9-10) — Money & Receipts

### Backend
- [ ] Payments module: collect, FIFO allocation, partial
- [ ] Payment reversal (owner only, audit logged)
- [ ] Deposits ledger
- [ ] Discounts with staff limit check
- [ ] Dues endpoint with aging
- [ ] Receipt PDF generation (Puppeteer, library logo)
- [ ] Thermal printer layout (58mm)
- [ ] Expense categories + expenses CRUD
- [ ] Activity log interceptor (har write operation)

### Frontend
- [ ] Collect payment modal (3-tap flow)
- [ ] Due students screen with bulk select
- [ ] Payment history
- [ ] Receipt preview + print + download
- [ ] Expenses screen
- [ ] Activity log viewer

**Sprint 4 done = paise collect ho sakte hain, receipt milti hai.**

---

## Sprint 5 (Week 11–12) — Attendance

### Backend
- [ ] QR token generation per student
- [ ] Scan endpoint: open-session by `check_out IS NULL` (not by date); bounce 5 min
- [ ] Multiple sessions / day (lunch); overnight `attendance_date` = check-in date
- [ ] Manual attendance
- [ ] Auto-checkout cron (shift end, overnight next morning)
- [ ] Daily + student monthly attendance queries

### Frontend
- [ ] QR scanner page (fullscreen, camera)
- [ ] Attendance today view + manual marking
- [ ] Student QR / ID card print (A4; thermal = Chrome `@page` 58mm if OS driver)

**Sprint 5 done = gate pe scan chal raha hai.**

---

## Sprint 6 (Week 13–14) — Notifications + jobs

### Backend
- [ ] BullMQ + worker process
- [ ] Cron: expiry-check (status range 1–7 days), fee-reminder, daily-summary
- [ ] WhatsApp BSP + 5 templates (welcome, receipt, 5d, day-0, overdue)
- [ ] SMS fallback (DLT) — OTP already Sprint 1
- [ ] Credits ledger + notification_log dedupe
- [ ] Bulk broadcast (simple audience)

### Frontend
- [ ] Notification settings + template toggles
- [ ] Credits balance widget
- [ ] Bulk message composer (basic)

**Sprint 6 done = reminders automatic ja rahe hain.**

---

## Sprint 7 (Week 15–16) — Dashboard + core reports

### Backend
- [ ] Dashboard KPI endpoint (cached) — collection, due, occupancy via `v_seat_occupancy` (no seat×shift CROSS JOIN)
- [ ] 4 core reports (not 8): collection, dues, admissions, P&L + Excel export
- [ ] Absent-alert cron (nice-to-have if time)

### Frontend
- [ ] Dashboard cards + 2 charts
- [ ] Reports hub with date range (4 reports)
- [ ] Due list already exists; wire aging

**Sprint 7 done = owner roz dashboard kholta hai.**

---

## Sprint 8 (Week 17–18) — SaaS, Hindi, launch prep

### Backend
- [ ] Subscription: trial, plan limits, upgrade CTA (Razorpay sub can be stub + manual)
- [ ] Super admin: `platform_admins` + tenant list + impersonate (SET LOCAL target tenant)
- [ ] Data export
- [ ] Rate limiting, Sentry
- [ ] Backup script + restore drill

### Frontend
- [ ] Billing page + plan limit warnings
- [ ] Hindi strings complete (keys Sprint 1 se the)
- [ ] Empty / loading / error states
- [ ] Offline **banner only** (“Internet nahi”) — sync queue Phase 2, jhooth mat bolo
- [ ] Super admin panel
- [ ] Onboarding checklist widget

### QA
- [ ] `17` checklist, k6, npm audit, Trivy
- [ ] Production deploy
- [ ] 5 libraries Excel → import
- [ ] On-site: har pilot pe 1 ghanta

---

## Pilot phase (Week 19–22)

| Week | Kaam |
|---|---|
| 19 | 5 libraries live, daily check-in, bugs |
| 20 | Top 10 feedback fix |
| 21 | Onboarding process refine (5 hi — aur mat add) |
| 22 | Testimonials, pricing page, paid-launch switch |

**Pilot exit criteria (paid launch se pehle):**
- [ ] 4/5 libraries 30 din se roz use kar rahe hain
- [ ] Crash rate < 0.5%
- [ ] Koi data loss incident nahi
- [ ] WhatsApp delivery rate > 95%
- [ ] 3 owners ne bola "ab paise dene ko tayyar hun"
- [ ] Onboarding without founder help possible

---

## MVP me ye NAHI banana (discipline)

❌ Student mobile app — Phase 2
❌ Online payment gateway — Phase 2 (cash se shuru karo)
❌ Biometric — Phase 2
❌ Lockers, complaints, leads, inventory — Phase 2
❌ Multi-branch advanced reporting — Phase 2
❌ Offline write-queue — Phase 2 (banner OK)
❌ 8-report hub — 4 reports kaafi; baaki Phase 2
❌ Marketplace, white-label — Phase 3
❌ AI kuch bhi — Phase 3

Har baar jab feature add karne ka mann kare, poocho: "Iske bina pilot library apna
register phenk sakti hai?" Agar haan, to Phase 2 me daalo.
