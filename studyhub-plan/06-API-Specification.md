# 06 — API Specification

Base URL: `https://api.studyhub.in/v1`
Auth: `Authorization: Bearer <access_token>` (JWT)
JWT payload: `{ sub: user_id, tid: tenant_id, role, bid: branch_id, exp }`

## Standard response envelope
```json
// Success
{ "success": true, "data": {...}, "meta": { "page": 1, "limit": 20, "total": 145 } }

// Error
{ "success": false, "error": { "code": "SEAT_ALREADY_BOOKED",
  "message": "Ye seat is shift me pehle se booked hai",
  "message_en": "This seat is already booked for this shift",
  "field": "seat_id" } }
```

## Standard query params for list endpoints
Offset pagination **hi** default (mobile tables, reports):
`?page=1&limit=20&search=ram&sort=-created_at&status=active&branch_id=<uuid>&from=2026-09-01&to=2026-09-30`

Cursor (`?cursor=` / `?after=`) **mat mix karo** Phase 1 me. Phase 2 me sirf
`activity_logs` / `notification_log` jaisi append-only badi tables pe cursor add
karna — alag endpoints, same list pe dono nahi.

---

## 1. Auth
```
POST   /auth/signup                 { name, library_name, mobile, city }
POST   /auth/send-otp               { mobile, purpose }
POST   /auth/verify-otp             { mobile, code, purpose } -> tokens
POST   /auth/login                  { mobile, password }
POST   /auth/refresh                { refresh_token }
-- hashed row in refresh_tokens (revocable). Redis access-token blacklist optional.
POST   /auth/logout
GET    /auth/me                     -> user + tenant + permissions + subscription
POST   /auth/change-password
```

## 2. Onboarding
```
GET    /onboarding/status           -> { step: 2, completed: false }
POST   /onboarding/library          { name, address, city, logo }
POST   /onboarding/shifts           { shifts: [...] }
POST   /onboarding/seats            { count: 100, prefix: "S", floors: [...] }
POST   /onboarding/fee-plans        { plans: [...] }
POST   /onboarding/complete
```

## 3. Branches / Shifts / Seats
```
GET    /branches
POST   /branches
PATCH  /branches/:id
DELETE /branches/:id

GET    /shifts?branch_id=
POST   /shifts                      { name, start_time, end_time, is_full_day }
PATCH  /shifts/:id
DELETE /shifts/:id

GET    /seats?branch_id=&shift_id=&status=
GET    /seats/map?branch_id=&shift_id=&date=   -> grid with occupancy per seat
POST   /seats/bulk                  { prefix:"S", from:1, to:100, floor:"1", type:"open" }
POST   /seats
PATCH  /seats/:id                   { status: "maintenance" }
DELETE /seats/:id
GET    /seats/available?shift_id=&from_date=&to_date=
```

## 4. Students
```
GET    /students                    (search, filters, pagination)
POST   /students
GET    /students/:id                -> profile + active membership + dues
PATCH  /students/:id
DELETE /students/:id                (soft)
POST   /students/:id/photo          (multipart)
POST   /students/:id/documents
GET    /students/:id/timeline
POST   /students/:id/pause          { from_date, reason }
POST   /students/:id/resume         { resume_date }
POST   /students/:id/leave          { leave_date, reason, refund_amount, refund_mode }
POST   /students/import             (CSV/Excel bulk import)
GET    /students/export             (Excel)
GET    /students/:id/qr             -> QR image / token
```

## 5. Fee Plans
```
GET    /fee-plans
POST   /fee-plans
PATCH  /fee-plans/:id
DELETE /fee-plans/:id
```

## 6. Memberships (admission / renewal)
```
POST   /memberships                 -- NEW ADMISSION (transactional)
       {
         student_id | student: {...},
         shift_id, seat_id, fee_plan_id,
         start_date, discount_amount, discount_reason,
         registration_fee, security_deposit,
         payment: { amount, mode, reference_no }
       }
       -> { membership, invoice, payment, receipt_url }

GET    /memberships?student_id=&status=&expiring_in=7
GET    /memberships/:id
POST   /memberships/:id/renew       { fee_plan_id, start_from:"expiry"|"today", payment }
POST   /memberships/:id/change-seat { new_seat_id, new_shift_id, effective_date }
POST   /memberships/:id/cancel      { reason, refund_amount }
GET    /memberships/expiring?days=7
```

## 7. Invoices & Payments
```
GET    /invoices?status=unpaid&student_id=
POST   /invoices                    (manual invoice)
GET    /invoices/:id
GET    /invoices/:id/pdf
POST   /invoices/:id/cancel

POST   /payments                    { student_id, invoice_id, amount, mode, reference_no, note }
GET    /payments?from=&to=&mode=&collected_by=
GET    /payments/:id/receipt        -> PDF url
POST   /payments/:id/receipt/whatsapp
POST   /payments/:id/reverse        { reason }   (owner only)

GET    /dues                        -> due list with aging
POST   /dues/remind                 { student_ids: [...] | "all" }

GET    /deposits?student_id=
POST   /deposits/refund             { student_id, amount, mode, adjust_due: true }
```

## 8. Online payments
```
POST   /payments/online/create-link { student_id, invoice_id, amount } -> { link }
POST   /payments/online/mandate     { student_id }   -- UPI AutoPay setup
POST   /webhooks/razorpay           (signature verified, idempotent)
```

## 9. Attendance
```
POST   /attendance/scan             { qr_token, branch_id, device_id }
       -> { student, action: "in"|"out", time, duration }
POST   /attendance/manual           { student_ids: [], date, check_in }
GET    /attendance?date=&branch_id=&shift_id=
GET    /attendance/student/:id?month=2026-09
GET    /attendance/absent?days=3
GET    /attendance/report?from=&to=&format=excel
POST   /attendance/biometric/push   (device webhook)
```

## 10. Expenses
```
GET    /expense-categories
POST   /expense-categories
GET    /expenses?from=&to=&category_id=
POST   /expenses
PATCH  /expenses/:id
DELETE /expenses/:id
```

## 11. Dashboard & Reports
```
GET    /dashboard?branch_id=
       -> { today_collection, month_collection, total_due, occupancy_pct,
            active_students, expiring_7d, new_admissions, left_this_month,
            collection_trend: [...], shift_occupancy: [...] }

GET    /reports/collection?from=&to=&group_by=day|mode|staff
GET    /reports/dues
GET    /reports/admissions?from=&to=
GET    /reports/churn?from=&to=
GET    /reports/attendance?from=&to=
GET    /reports/expenses?from=&to=
GET    /reports/pnl?from=&to=
GET    /reports/occupancy
GET    /reports/discounts?from=&to=
GET    /reports/deposit-ledger
GET    /reports/:name/export?format=excel|pdf
```

## 12. Notifications
```
GET    /notification-templates
PATCH  /notification-templates/:id  { body, is_enabled }
GET    /notification-settings
PATCH  /notification-settings       { fee_reminder_5d: true, ... }
POST   /notifications/broadcast     { audience: {shift_id?, status?, ids?}, message }
GET    /notifications/log?from=&to=&status=
GET    /credits                     -> { whatsapp: 1450, sms: 800 }
POST   /credits/topup               { channel, quantity }
```

## 13. Leads / Complaints / Lockers / Notices
```
GET|POST|PATCH  /leads, /leads/:id
POST   /leads/:id/convert           -> creates student + membership
GET|POST        /waiting-list
GET|POST|PATCH  /complaints, /complaints/:id
GET|POST        /lockers
POST   /lockers/:id/assign          { student_id, from_date }
POST   /lockers/:id/release
GET|POST        /notices
```

## 14. Staff & Settings
```
GET|POST|PATCH|DELETE  /staff, /staff/:id
GET    /activity-logs?user_id=&action=&from=&to=
GET|PATCH              /settings
POST   /settings/logo
GET    /settings/backup             -> full tenant data export (JSON/Excel)
```

## 15. Subscription (SaaS billing)
```
GET    /subscription                -> current plan, usage, limits, days left
GET    /plans
POST   /subscription/upgrade        { plan_code, cycle }
POST   /subscription/cancel
GET    /subscription/invoices
```

## 16. Student app endpoints
```
POST   /student/auth/send-otp       { mobile }
POST   /student/auth/verify-otp
GET    /student/me                  -> membership, seat, expiry, due
GET    /student/payments
GET    /student/payments/:id/receipt
GET    /student/attendance?month=
POST   /student/pay                 -> payment link
GET    /student/notices
POST   /student/complaints
GET    /student/qr
POST   /student/requests            { type: "seat_change"|"pause"|"leave", ... }
-- persisted on student_requests (staff-on-behalf Phase 1; student app Phase 2)
```

## 17. Public / Marketplace (Phase 3)
```
GET    /public/libraries?city=&lat=&lng=&shift=&max_price=
GET    /public/libraries/:slug
POST   /public/libraries/:slug/enquiry   -> creates lead
GET    /public/libraries/:slug/availability
```

## 18. Super admin (internal)
```
GET    /admin/tenants?status=&plan=
GET    /admin/tenants/:id
POST   /admin/tenants/:id/impersonate   (audit logged)
PATCH  /admin/tenants/:id/plan
GET    /admin/metrics                   -> MRR, churn, signups, conversion
POST   /admin/broadcast
```

---

## Error codes (standardise these)
| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHENTICATED` | 401 | Token missing/expired |
| `FORBIDDEN` | 403 | Role/permission nahi |
| `NOT_FOUND` | 404 | Resource nahi mila (cross-tenant bhi yahi do) |
| `VALIDATION_ERROR` | 422 | Field level errors |
| `SEAT_ALREADY_BOOKED` | 409 | Seat+shift overlap |
| `PLAN_LIMIT_EXCEEDED` | 402 | Student/branch limit cross |
| `INSUFFICIENT_CREDITS` | 402 | WhatsApp/SMS credits khatam |
| `SUBSCRIPTION_EXPIRED` | 402 | Trial/plan expire |
| `DUPLICATE_MOBILE` | 200 + warning | Block nahi — client confirm kare, `force: true` se POST dubara |
| `RATE_LIMITED` | 429 | Too many requests |

## API conventions
- Idempotency: `POST /payments` aur webhooks pe `Idempotency-Key` header support karo
- Har response me `X-Request-Id` — support debugging ke liye
- Pagination: Phase 1 me **sirf** `page` + `limit` (max 100). Cursor nahi.
- Invoice `overdue` query param allowed; ye `due_date < today AND status IN (unpaid,partial)` se derive — status column me `overdue` nahi.
- Sab dates ISO 8601, DB me UTC, response me tenant timezone ke saath
- Money hamesha paise (integer) me — `"amount": 80000` = ₹800
