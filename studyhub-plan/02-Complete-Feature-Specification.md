# 02 — Complete Feature Specification

Har feature ka detailed spec. Priority tags:
- **P0** = MVP, bina iske launch nahi
- **P1** = Phase 2, growth ke liye zaroori
- **P2** = Phase 3, differentiation/moat

---

## MODULE 1 — Authentication & Onboarding

### 1.1 Signup (P0)
- Mobile number + OTP (primary) — email optional
- Fields: Owner name, Library name, City, Mobile, Password
- OTP via SMS (DLT registered template)
- Signup ke baad turant 14-day trial start, koi card nahi maanga jaata

### 1.2 Setup Wizard (P0) — sabse important screen
Naya owner ko 15 minute me first admission tak pahunchana hai. 5 step wizard:
1. **Library details** — naam, address, logo upload, contact number
2. **Shifts banao** — default suggestions dikhao (Morning 6AM-12PM, Noon 12PM-6PM,
   Evening 6PM-11PM, Full Day, 24x7). Owner sirf tick kare ya timing edit kare.
3. **Seats banao** — "Kitni seats hain?" → number daalo → auto generate S1...S100.
   Advanced: floor/room wise, cabin vs open, AC vs non-AC
4. **Fee plans** — har shift ka rate (1 month / 3 month / 6 month), security deposit,
   registration fee
5. **Pehla student add karo** — guided

Wizard skip karne ka option ho par progress bar dashboard pe dikhta rahe.

### 1.3 Login (P0)
- Mobile + OTP ya Mobile + Password
- "Remember me" 30 din
- Forgot password via OTP
- Session: JWT access token (15 min) + refresh token (30 days)

### 1.4 Roles & Permissions (P0)
| Permission | Owner | Manager | Staff | Accountant |
|---|---|---|---|---|
| Student add/edit | ✅ | ✅ | ✅ | ❌ |
| Student delete | ✅ | ❌ | ❌ | ❌ |
| Payment collect | ✅ | ✅ | ✅ | ✅ |
| Payment delete/edit | ✅ | ❌ | ❌ | ❌ |
| Discount dena | ✅ | ✅ (limit tak) | ❌ | ❌ |
| Expense add | ✅ | ✅ | ❌ | ✅ |
| Reports dekhna | ✅ | ✅ | ❌ | ✅ |
| Profit/loss dekhna | ✅ | ❌ | ❌ | ✅ |
| Settings change | ✅ | ❌ | ❌ | ❌ |
| Staff manage | ✅ | ❌ | ❌ | ❌ |

Custom permission override bhi allow karo (per-staff checkbox).

---

## MODULE 2 — Library, Branch & Seat Setup

### 2.1 Multi-branch (P0 basic, P1 advanced)
- Ek tenant ke andar multiple branches
- Har branch ke apne seats, shifts, students, staff
- Top bar me branch switcher
- Owner ko consolidated view (all branches) ka option

### 2.2 Shift Management (P0)
- Name, start_time, end_time, is_active
- Overnight shift support (10PM - 6AM) — date rollover handle karo
- Har shift ka apna seat capacity (kyunki kuch seats sirf full-day ke liye reserved ho
  sakti hain)
- Shift-wise color code (UI me)

### 2.3 Seat Layout (P0)
- Seat create: bulk generate (S1-S100) ya manual
- Attributes: seat_no, floor, room/section, type (open / cabin / AC / non-AC / window),
  status (available / blocked / maintenance)
- **Visual seat map** — grid layout, drag to arrange (P1), simple grid (P0)
- Color legend:
  - 🟩 Green = khaali
  - 🟥 Red = allotted
  - 🟨 Yellow = expiring in 3 days
  - 🟦 Blue = partially booked (kuch shift free hai)
  - ⬜ Grey = blocked/maintenance
- Filter: shift dropdown se dekho ki us shift me kaunsi seat khaali hai
- Seat pe click → student ki detail popup (naam, photo, shift, expiry, due)

### 2.4 Seat Sharing (P0 — CRITICAL)
Ek physical seat, multiple shifts, alag alag students.
- `seat_allocations` table shift-wise entry rakhta hai
- Constraint: same seat + same shift + overlapping date range = ERROR
- Seat map me "3/3 shifts booked" ya "1/3 booked" dikhao
- Full-day membership = us seat ki saari shifts block

### 2.5 Locker Management (P1)
- Locker number, size, monthly rent, key deposit
- Student ko assign, alag invoice line item
- Locker khaali/bhara ka view

---

## MODULE 3 — Student Management

### 3.1 Student Registration (P0)
**Required:** Name, Mobile
**Optional but recommended:** Photo (camera se direct capture), Guardian mobile,
Address, DOB, Gender, Email, ID proof type + number + photo, Exam target
(SSC/UPSC/NEET/JEE/Banking/Board/Other), Education, Emergency contact, Blood group

- Auto student ID generate (e.g., ST-0001) — prefix configurable
- Duplicate check on mobile number → warning dikhao par block mat karo
  (bhai-behen ka same number ho sakta hai)
- Photo compress karke store (max 300KB)

### 3.2 Student Statuses (P0)

`students.status` **coarse** hai: `active | paused | left | blacklisted`.
`expiring` / `expired` **membership** pe store, lists derive karti hain
(`memberships.end_date`, `memberships.status`). Do memberships (subah+shaam) ek
student-status se nahi dikhte.

| Status | Kahan | Matlab |
|---|---|---|
| Active | student + membership | Membership chal rahi, days_left > 7 |
| Expiring | membership only | days_left 1–7 (range, sparse 7/5/3/1 nahi) |
| Expired | membership only | days_left < 0; seat grace ke baad release |
| Left | student | Seat chhod di, deposit settle |
| Paused | student + membership | Freeze — days extend |
| Blacklisted | student | Dobara admission nahi |
| Superseded | membership only | Mid-term renew `start_from=today` |

### 3.3 Student Profile Page (P0)
Tabs: Overview | Membership History | Payments | Attendance | Documents | Notes
- Overview me: photo, seat, shift, expiry date, due amount, quick actions
  (Renew / Collect Fee / Change Seat / Send Reminder / Pause / Leave)
- Timeline view — kab join kiya, kab renew kiya, kab seat badli

### 3.4 Search & Filters (P0)
- Search by name, mobile, student ID, seat number
- Filters: status, shift, branch, seat type, exam target, expiry date range,
  due amount > 0
- Saved filters (P1): "Due students", "Expiring this week"
- Bulk actions: send reminder, export, change shift

### 3.5 Student Documents (P1)
- Aadhaar / ID upload, agreement, photo
- Storage me encrypted, signed URL se access
- **Compliance note:** ID proof sensitive data hai — DPDP Act ke hisaab se consent lo,
  retention policy set karo, delete option do

---

## MODULE 4 — Membership & Fees

### 4.1 Fee Plans (P0)
- Name (e.g., "Morning Shift - 1 Month")
- Linked shift (ya "any shift")
- Duration: days ya months
- Amount
- Optional: seat_type based pricing (AC seat mehenga)
- Registration fee (one-time), Security deposit (refundable)

### 4.2 New Membership / Admission (P0)
Flow:
1. Student select/create
2. Shift select → us shift ki available seats dikhao
3. Seat select (ya "no seat" — floating membership)
4. Plan select → amount auto-fill
5. Start date (default aaj) → end date auto-calculate
6. Discount (amount ya %) + reason
7. Registration fee + security deposit add
8. Total dikhao → payment collect (full ya partial)
9. Receipt generate → print / WhatsApp / download

### 4.3 Renewal (P0)
- Expiring students ki list se one-click renew
- New start date = purani end date + 1 din (gap na ho)
- Agar late renewal hai to option: "aaj se shuru karo" ya "expiry se shuru karo"
- Same seat continue by default, badalne ka option

### 4.4 Invoicing (P0)
- Har membership pe ek invoice auto-generate
- Invoice number series configurable (INV-2026-0001)
- Line items: plan fee, registration, deposit, locker, discount
- Status column: `unpaid | partial | paid | cancelled`. **Overdue column nahi** —
  UI/API derive: `due_date < today AND status IN (unpaid, partial)`
- GST support (P1) — GSTIN, CGST/SGST split, HSN/SAC code

### 4.5 Payment Collection (P0)
- Modes: Cash, UPI, Card, Bank Transfer, Cheque, Online (gateway)
- Partial payment allowed → due tracking
- Payment ke saath: date, collected_by (staff), reference number, note
- **Cash entry 3 tap me honi chahiye** — ye sabse zyada use hoga
- Payment edit/delete sirf owner kar sake, aur activity log me record ho

### 4.6 Receipt (P0)
- PDF generate with library logo, receipt number, student detail, amount, mode, balance
- Actions: Print (thermal printer support), Download, WhatsApp bhejo, SMS link
- Thermal printer (58mm/80mm) ke liye alag compact layout

### 4.7 Security Deposit (P0)
- Admission pe collect, alag ledger me
- Student leave kare to: due amount adjust karo → baaki refund
- Refund entry with mode aur date
- Report: total deposit liability

### 4.8 Discounts & Concessions (P0)
- Amount ya percentage
- Reason mandatory (sibling, scholarship, referral, festival offer)
- Staff ke liye max discount limit set kar sakte ho
- Discount report — kitna diya, kisne diya

### 4.9 Due Management (P0)
- Due students ka dedicated view, amount aur days overdue ke saath
- Aging buckets: 0-7 din, 8-15, 16-30, 30+
- Bulk reminder bhejo
- Owner ko daily due summary WhatsApp pe

### 4.10 Online Payment (P1)
- Razorpay / Cashfree integration
- Student ko payment link WhatsApp pe
- UPI AutoPay mandate → har mahine auto-deduct (game changer)
- Webhook se auto reconciliation
- Failed payment retry + notification

---

## MODULE 5 — Attendance

### 5.1 QR Attendance (P0)
- Har student ka unique QR (student ID card pe ya app me)
- Library ke gate pe tablet/phone pe scanner page khula rahe
- Scan → in-time mark, dobara scan → out-time
- Ya reverse: library ka QR, student apne app se scan kare (sasta, hardware nahi chahiye)

### 5.2 Manual Attendance (P0)
- Staff list se tick kare
- Bulk mark present

### 5.3 Biometric Integration (P1)
- ESSL / Mantra / Realtime devices
- Push API ya periodic pull via local agent
- Fingerprint enrollment student profile se

### 5.4 RFID Card (P2)
- Card tap on reader → attendance

### 5.5 Attendance Reports (P0)
- Daily: aaj kitne aaye, kaun nahi aaya
- Student-wise monthly: days present, total hours, average hours
- Shift-wise footfall graph
- Absent alert (P1): 3 din se nahi aaya → owner ko notify (churn signal!)
- Parent ko monthly attendance report bhejne ka option

---

## MODULE 6 — Notifications & Communication

### 6.1 Channels (P0)
- WhatsApp (Meta Cloud API ya AiSensy/Interakt/Wati)
- SMS (DLT registered, MSG91/Textlocal)
- In-app / push (student app, P1)
- Email (optional, low priority for India)

### 6.2 Automated Triggers (P0)
| Trigger | Kab | Kisko |
|---|---|---|
| Welcome | Admission ke turant baad | Student |
| Receipt | Har payment pe | Student |
| Fee reminder | Expiry se 5 din pehle | Student |
| Fee reminder | Expiry ke din | Student |
| Overdue | Expiry ke 3 din baad | Student + Guardian |
| Membership expired | Expiry ke 7 din baad | Student |
| Birthday wish | Birthday pe | Student |
| Daily summary | Roz 9 PM | Owner |
| Absent alert | 3 din absent | Owner |
| Seat available | Waiting list wale ko | Lead |

Har trigger ON/OFF karne ka switch settings me.

### 6.3 Bulk Announcements (P0)
- Sab / shift-wise / filter-wise students ko message
- Use case: holiday, timing change, AC repair, fee hike, new facility
- Character count + credits deduction dikhao

### 6.4 Notice Board (P1)
- Library ka digital notice board — student app aur portal me dikhe

### 6.5 Credits System (P0)
- Har plan me monthly WhatsApp/SMS credits
- Balance dashboard pe dikhe
- Khatam hone pe warning + top-up option

---

## MODULE 7 — Expenses & Accounting

### 7.1 Expense Entry (P0)
- Categories: Rent, Electricity, Salary, Internet, Water/RO, Maintenance, Furniture,
  Cleaning, Marketing, Miscellaneous (custom bhi)
- Amount, date, payment mode, vendor, bill photo upload, note
- Recurring expense (P1): rent har mahine auto-entry

### 7.2 Staff Salary (P1)
- Staff profile me salary, payment date
- Salary paid entry → expense me auto

### 7.3 P&L Report (P0)
- Monthly: Total collection − Total expense = Profit
- Category-wise expense pie chart
- Month-on-month comparison
- Yearly summary

### 7.4 Cash Book (P1)
- Opening balance, cash in, cash out, closing balance
- Daily cash reconciliation — staff ko day-end pe match karna hoga

---

## MODULE 8 — Dashboard & Reports

### 8.1 Owner Dashboard (P0)
Cards (top row):
- Aaj ka collection | Is mahine ka collection | Total due | Occupancy %
- Active students | Expiring in 7 days | New admissions this month | Left this month

Charts:
- Last 30 days collection trend (line)
- Shift-wise occupancy (bar)
- Revenue vs Expense (last 6 months)
- Seat map preview

Quick actions: New Admission | Collect Fee | Send Reminders | Add Expense

### 8.2 Reports List
**P0 (Sprint 7 — ye 4):** collection, dues, admissions, P&L.
**P1:** student list export, churn, attendance, expenses, occupancy, discounts,
deposit ledger, staff activity. PDF/WhatsApp share P1; Excel P0 on the four.

1. Collection report (date range, mode-wise, staff-wise) — P0
2. Due/Outstanding report — P0
3. Student list (with filters) — list screen P0, fancy export P1
4. Admissions report — P0
5. Left/churn report — P1
6. Attendance report — P1 (daily view Sprint 5 kaafi)
7. Expense report — P1 (expense screen P0)
8. P&L report — P0
9. Seat occupancy report — P1 (dashboard % P0)
10. Discount report — P1
11. Security deposit ledger — P1
12. Staff activity log — P1 (viewer Sprint 4 basic OK)

### 8.3 Advanced Analytics (P2)
- Churn prediction — kaun agle mahine chhod sakta hai
- Best/worst performing shift
- Revenue forecast
- Exam-target wise student mix
- Peak hours heatmap

---

## MODULE 9 — Lead / Enquiry CRM (P1)

- Walk-in ya online enquiry capture: naam, mobile, interested shift, source
- Status: New → Contacted → Visited → Converted → Lost
- Follow-up date + reminder to staff
- Lost reason capture (price, location, no seat, joined competitor)
- Conversion funnel report
- Waiting list: seat khaali hote hi auto notification

---

## MODULE 10 — Student App / Portal (P1)

Student ke liye (React Native app + web portal):
- Login via mobile OTP
- Dashboard: seat number, shift, expiry countdown, due amount
- Pay now (online payment)
- Payment history + receipt download
- Attendance history + monthly hours
- Notice board
- Complaint/feedback raise + status track
- Seat change request
- Leave/pause request
- Digital ID card with QR
- Study timer / goal tracker (engagement feature, P2)

---

## MODULE 11 — Complaints & Feedback (P1)

- Categories: AC/Fan, WiFi, Cleanliness, Noise, Water, Light, Furniture, Other
- Student raise kare → staff ko assign → status (Open/In Progress/Resolved)
- Resolution time tracking
- Monthly satisfaction score

---

## MODULE 12 — Inventory / Library Items (P2)

- Books, magazines, newspapers register
- Issue-return tracking
- Fine for late return
- Stationery sale (pen, copy) with billing

---

## MODULE 13 — Public Page & Marketplace (P2)

### 13.1 Library public page
- `studyhub.in/<library-slug>` — photos, facilities, timings, price, map, reviews
- "Enquire now" form → seedha CRM me lead
- Real-time available seats dikhao
- SEO optimized (local search se organic leads)

### 13.2 Student marketplace
- "Mere paas library dhoondo" — location, price, shift, facility filter
- Reviews & ratings
- Book a trial day
- Ye tumhara moat hai — owners ko free customers milenge

---

## MODULE 14 — SaaS Admin Panel (P0, tumhare liye)

- Saare tenants ki list, plan, status, MRR
- Signup funnel, trial → paid conversion
- Churn dashboard
- Usage metrics per tenant (login frequency, students, messages)
- Impersonate tenant (support ke liye, with audit log)
- Plan/pricing manage
- Broadcast to all owners (product updates)
- Support ticket inbox

---

## MODULE 15 — Settings

- Library profile, logo, letterhead
- Shifts, seats, fee plans, categories
- Invoice/receipt template + numbering
- Notification templates + toggles
- Grace period days, auto-expiry rules
- Language: Hindi / English
- Staff & permissions
- Data export (full backup — trust building feature)
- Subscription & billing
