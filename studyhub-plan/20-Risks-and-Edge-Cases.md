# 20 — Risks & Edge Cases

## PART A — Business Risks

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| Owner product use hi nahi karta (Excel wapas) | 🔴 High | High | Free data migration, on-site onboarding, activation tracking, week-1 daily check-in |
| Churn 8-10% pe pahunch jaye | 🔴 High | Medium | Annual plans, absent-alert feature (owner ko value roz dikhe), proactive support call |
| Koi funded competitor free me de de | 🟠 Medium | Medium | Local density + on-ground support + marketplace moat. Price war mat karo, service se jeeto |
| WhatsApp API ban/policy change | 🔴 High | Low-Med | SMS fallback ready, multi-BSP support, direct Meta account backup |
| Payment gateway account suspend | 🔴 High | Low | Do gateways integrate karo (Razorpay + Cashfree) |
| Data breach | 🔴 Critical | Low | Security checklist, RLS, encryption, insurance, incident plan |
| Founder burnout (solo) | 🔴 High | High | Realistic timeline, month 5 pe hire, weekly off lo |
| Sales nahi chal rahi | 🟠 Medium | Medium | Channel diversify, referral push, content start karo |
| Cash out ho jaye | 🔴 High | Medium | 6 mahine runway rule, annual plans se upfront cash |
| Ek bade client pe dependence | 🟠 Medium | Low | Koi ek client 10% revenue se zyada na ho |

---

## PART B — Technical Risks

| Risk | Mitigation |
|---|---|
| **Cross-tenant data leak** | 3-layer: RLS + ORM middleware + automated test suite in CI |
| **Seat double booking** | DB-level exclusion constraint (application logic pe bharosa nahi) |
| **Payment mismatch / double charge** | Idempotency keys, webhook dedupe, daily reconciliation cron |
| **Data loss** | Daily backup + PITR + **monthly restore drill** |
| **Duplicate notifications** | Dedupe key unique index, idempotent jobs |
| **Race condition on invoice number** | Row-locked counter table, not MAX()+1 |
| **Slow query as data grows** | Slow query log review, indexes, partition attendance/logs after 10M rows |
| **Server down** | Uptime monitor, documented DR runbook, 2-hour RTO |
| **Migration breaks production** | Expand-contract pattern, staging test, rollback plan, backup before migrate |
| **Third-party API down** | Circuit breaker, queue retry, graceful degradation (WhatsApp down → SMS) |

---

## PART C — India-specific edge cases (ye MVP me hi handle karo)

Ye wo cheezein hain jo foreign software me nahi hoti aur yahi tumhara competitive
advantage hai.

### 1. Seat sharing across shifts
Ek seat, 3 students, 3 alag shifts. Foreign gym software me ye concept hi nahi hai.
→ Exclusion constraint on (seat, shift, period)

### 2. Cash-dominant collection
70%+ payment cash me. Digital-first design fail ho jayega.
→ Cash entry 3 tap me, cash book, daily reconciliation

### 3. Ek mobile number, do students
Bhai-behen, ya student ke paas phone nahi to bhai ka number.
→ Unique constraint nahi, warning dikhao, notification me naam include karo

### 4. Mid-month admission
Student 17 tarikh ko aaya.
→ Anniversary billing default (join date se mahina), proration optional

### 5. Membership pause
Exam dene gaya, shaadi me gaya, ghar gaya 15 din.
→ Pause/resume with day extension, seat hold

### 6. Grace period
2 din late renewal — seat turant kisi aur ko de di to jhagda.
→ Configurable grace (default 3 din), phir auto-release

### 7. Security deposit
Almost har library leti hai, refundable hoti hai, leave pe due adjust hoti hai.
→ Separate ledger, settlement flow

### 8. Fee plan rate change
Owner ne ₹800 se ₹900 kiya — purane students pe asar nahi hona chahiye jab tak
renewal na ho.
→ Membership me amount snapshot store karo, plan reference nahi

### 9. Shift timing change
Owner ne evening shift 6-11 se 5-11 kar di — existing memberships kya hongi?
→ Shift edit pe warning, existing memberships unaffected

### 10. Slow / no internet
Tier-3 me BSNL/Jio flaky hai.
→ Light pages, offline queue (Phase 2), optimistic UI

### 11. Hindi UI
Staff angrezi nahi padh pata. Ye adoption ka #1 blocker hai.
→ Full Hindi translation, error messages bhi

### 12. Low-end Android phones
Redmi 3GB RAM, Chrome. Heavy JS bundle se app hang karega.
→ Bundle size budget (<300KB initial), lazy loading, no heavy animations

### 13. Thermal printer
Bahut libraries me 58mm receipt printer hai.
→ Alag compact print layout

### 14. Guardian involvement
Parents ko attendance report chahiye hoti hai.
→ Guardian mobile field, monthly report option

### 15. Festival / exam season pattern
Diwali, Holi pe students ghar jaate hain. March-April me exam ke baad mass exodus.
Nov-Jan me admission peak.
→ Seasonality dashboard me dikhao, churn spike ko normal treat karo

### 16. Owner ka trust issue
"Mera data aapke paas hai, aap band ho gaye to?"
→ Full export button prominent, "data aapka hai" messaging, backup status dikhao

### 17. Staff cash leakage
Ye owner ka silent pain hai jo wo bolta nahi.
→ Activity log, staff-wise collection report, discount audit, payment edit sirf owner

### 18. Same student, dobara admission
6 mahine baad wapas aaya.
→ Purana record dhoondho, history preserve karo, "wapas aaya" flag

### 19. Multiple exams, multiple timings
UPSC wala 12 ghante, board wala 4 ghante. Alag pricing chahiye.
→ Flexible shift + plan combination

### 20. Overnight / 24×7 shift
10 PM - 6 AM shift. Date rollover, attendance date confusion.
→ `is_overnight` flag, attendance_date = check_in date, **open session** =
`check_out IS NULL` (today ki date se lookup nahi). Lunch out+in = doosri row;
`UNIQUE(student_id, date)` nahi.

### 21. Aadhaar / ID proof handling

### 21. Aadhaar / ID proof handling
DPDP Act ke baad sensitive data hai.
→ Encrypt at rest, mask in UI, consent, retention policy, delete option

### 22. GST
Kuch libraries GST registered hain (₹20 lakh+ turnover).
→ GSTIN field, CGST/SGST split, HSN code, GSTR-friendly export (Phase 2)

### 23. Refund disputes
"Maine ₹500 diya tha, aapke system me nahi hai"
→ Har payment ka receipt, WhatsApp pe delivered proof, immutable payment log

### 24. Student ne seat pe apna saaman rakh diya
Physical issue par software me: seat "occupied but expired" state chahiye.
→ Grace period + owner ko alert + "belongings pending" note field

### 25. Library band ho gayi / owner badal gaya
→ Account transfer process, data export, subscription cancel with data retention

---

## PART D — Kya NAHI banana (scope discipline)

Ye ideas achhe lagenge par MVP ko maar denge:

❌ **Video surveillance integration** — hardware complexity, kam log maangenge
❌ **Full accounting software** (Tally replacement) — CA ka kaam hai, export kaafi hai
❌ **Study material / test series** — alag business hai, Phase 3 me partnership karo
❌ **Chat between students** — moderation ka sirdard, koi nahi maangta
❌ **Gamification / leaderboard** — sunne me acha, use koi nahi karta
❌ **Multi-currency, multi-country** — India pe focus karo
❌ **AI chatbot for students** — Phase 3, pehle basics
❌ **Desktop app** — web hi kaafi hai
❌ **Blockchain kuch bhi** 🙂

---

## PART E — Decision log (ye maintain karo)

Har badi decision likh kar rakho — 6 mahine baad yaad nahi rahega ki kyun kiya tha.

```
Format:
Date | Decision | Options considered | Why chosen | Revisit when

2026-09-15 | Shared DB multi-tenancy | DB-per-tenant, schema-per-tenant, shared+RLS |
Cost aur ops burden 10x kam, 1000 tenants tak scale karega |
Revisit at 1000 tenants ya pehle enterprise compliance demand pe

2026-09-07 | v1.1 freeze (audit) | see rows below | Plan pack internal contradictions | —

2026-09-07 | RLS: FORCE + set_config in $transaction + platform_admins |
SET LOCAL at connection start; users.tenant_id NULL for super admin |
NULL admin rows RLS hide (login break); SET LOCAL outside txn no-op / session SET pool leak |
Revisit never — security

2026-09-07 | Forecast SSOT = 18 | 00 300/₹3L vs 14 ₹2.7L vs 18 218 |
Single funnel; M12 base 127/₹1.05L after M6 launch | Revisit after first paid quarter

2026-09-07 | Solo MVP 16–20 weeks | 00/09 10 weeks vs 19 5–6 months |
19 was already honest; 09 Sprint 5 split into 5–8 | Revisit if 2nd full-stack joins

2026-09-07 | Greenfield Nest/Next, freeze Firebase prototype |
Evolve Vite+Firebase | Prototype in this repo; not a plan-theory flaw | Revisit only if prototype already has paying users

2026-09-07 | Pilot = 5 libraries × 6 months free | 6 months vs lifetime |
Lifetime kills ARPU | Revisit after 5 convert or churn

2026-09-07 | Prices ex-GST 18%; white-label ₹4,999 + ₹15k | incl GST / ₹999–2999 leftover |
Sales call consistency | —
```
