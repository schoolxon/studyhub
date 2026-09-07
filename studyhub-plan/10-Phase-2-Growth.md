# 10 — PHASE 2: Growth (Month 7–10)

**Goal:** Paid launch ke baad retention + revenue features. Exit ~70 paying,
₹55k+ MRR (`18` Month 10).
**Theme:** Online collection, student app, ops depth.

---

## Month 7 — Monetisation

### 4.1 Online Payments (highest ROI feature)
- [ ] Razorpay integration: order create, checkout, webhook
- [ ] Payment link generation → WhatsApp bhejo
- [ ] **UPI AutoPay mandate** — student ek baar approve kare, har mahine auto-deduct
      (ye game-changer hai, owner ka collection problem hi khatam)
- [ ] Auto reconciliation: webhook → payment entry → invoice update → receipt
- [ ] Failed payment retry + notification
- [ ] Settlement report (kitna Razorpay se aaya)

**Business impact:** Owner ka 60% collection effort khatam. Ye feature akela upgrade
justify karta hai.

### 4.2 SaaS billing live
- [ ] Trial expiry flow: 3 din pehle, 1 din pehle, expiry day emails/WhatsApp
- [ ] Payment page for subscription (Razorpay subscriptions)
- [ ] Dunning: payment fail → day 1, 3, 5, 7 retry + reminder → day 10 suspend
- [ ] Suspension: read-only mode (data dikhega, naya entry nahi) — kabhi data mat chhupao
- [ ] Annual plan with 2 months free
- [ ] Invoice GST-compliant for tenants

### 4.3 Pricing page + self-serve signup
- [ ] Public marketing site (landing, features, pricing, demo video)
- [ ] Self-serve signup without sales call
- [ ] In-app upgrade flow

---

## Month 8 — Student App

### 5.1 React Native app (Android priority)
- [ ] Mobile OTP login
- [ ] Home: seat, shift, expiry countdown, due amount
- [ ] Pay now (Razorpay checkout in-app)
- [ ] Payment history + receipt download
- [ ] Attendance history + monthly hours graph
- [ ] Digital ID card with QR (attendance ke liye)
- [ ] Notices
- [ ] Complaint raise + track
- [ ] Push notifications (FCM)
- [ ] Play Store publish

### 5.2 Student web portal
- [ ] Same features, `studyhub.in/s/login` pe (app install na karne walon ke liye)

**Business impact:** Owner ka support load kam, student engagement badhta hai,
"aapki library me app hai" = owner ka status symbol.

---

## Month 9 — Operations depth

### 6.1 Lead / Enquiry CRM
- [ ] Lead capture (walk-in + online form)
- [ ] Pipeline: New → Contacted → Visited → Converted → Lost
- [ ] Follow-up reminders to staff
- [ ] Lost reason analytics
- [ ] Lead → student one-click conversion
- [ ] Waiting list with auto-notify on seat availability

### 6.2 Biometric integration
- [ ] ESSL / Mantra device support
- [ ] Local agent (Windows service) ya push API
- [ ] Fingerprint enrollment from student profile
- [ ] Fallback to QR if device offline

### 6.3 Lockers
- [ ] Locker master, assignment, rent billing
- [ ] Key deposit tracking

### 6.4 Complaints & feedback
- [ ] Category-wise complaints, assignment, resolution SLA
- [ ] Monthly satisfaction score

### 6.5 Advanced reports
- [ ] GST invoice + GSTR-friendly export
- [ ] Cash book with daily reconciliation
- [ ] Staff-wise collection + activity report
- [ ] Multi-branch consolidated P&L
- [ ] Custom report builder (choose columns + filters)

---

## Month 10 — Retention & scale readiness

### 7.1 Offline mode
- [ ] Service worker + IndexedDB queue
- [ ] Admission/payment entry offline → sync on reconnect
- [ ] Conflict resolution (seat already taken while offline → flag for owner)
- [ ] "Offline" banner + pending sync count

**Kyun zaroori:** tier-3 sheher me internet flaky hai. Ek baar entry fail hui to owner
bharosa kho deta hai.

### 7.2 Recurring expenses & staff payroll
- [ ] Recurring expense auto-entry
- [ ] Staff salary, attendance, payslip

### 7.3 Data & trust features
- [ ] Full data export (Excel + JSON) — owner ko lagna chahiye data uska hai
- [ ] Trash / restore (30 din) for deleted students
- [ ] Backup status visible to owner ("Aapka data roz backup hota hai")

### 7.4 Multi-branch polish
- [ ] Branch switcher + "All branches" consolidated view
- [ ] Branch-wise permission for staff
- [ ] Inter-branch student transfer

### 7.5 Product-led growth hooks
- [ ] Referral program: ek library laao → 1 mahina free (dono ko)
- [ ] "Powered by StudyHub" branding on receipts (Starter plan pe, Pro me remove)
- [ ] In-app NPS survey after 30 days
- [ ] Onboarding checklist with progress → completion rate track karo

---

## Phase 2 exit criteria (calendar Month 10)

| Metric | Target |
|---|---|
| Paying customers | 70+ (`18` base = 72) |
| MRR | ₹55,000+ |
| Trial → paid conversion | >25% |
| Monthly churn | <5% |
| Student app installs | 1,000+ (Android-first) |
| Online payment share of collection | >20% |
| Support tickets per customer | <1/month |
| NPS | >40 |

---

## Phase 2 me priority ka rule

Har feature request ko is grid me daalo:

| | Kam customers maang rahe | Bahut customers maang rahe |
|---|---|---|
| **Revenue badhata hai** | Later | **Abhi karo** |
| **Revenue nahi badhata** | Never | Maybe |

Aur ek sawaal roz poocho: "Kya ye feature churn kam karega ya conversion badhayega?"
Agar dono nahi, to backlog me daalo.
