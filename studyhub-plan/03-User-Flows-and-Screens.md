# 03 — User Flows & Screen List

## A. Screen inventory (Admin Web App)

### Auth
1. Login (mobile + OTP / password)
2. Signup
3. OTP verify
4. Forgot password
5. Setup wizard (5 steps)

### Main
6. Dashboard
7. Seat Map
8. Students — list
9. Student — add/edit form
10. Student — profile (tabs)
11. New Admission (multi-step)
12. Renewal
13. Collect Payment (modal)
14. Receipt preview / print
15. Due Students
16. Attendance — today
17. Attendance — QR scanner
18. Attendance — reports
19. Expenses — list + add
20. Reports hub (12 reports)
21. Leads / Enquiries (P1)
22. Complaints (P1)
23. Lockers (P1)
24. Bulk message composer
25. Settings (8 sub-pages)
26. Staff management
27. Subscription & billing
28. Activity log

### Student App (P1)
29. Login
30. Home / my membership
31. Pay now
32. Payment history
33. Attendance history
34. Notices
35. Complaint raise
36. Digital ID card / QR
37. Profile

### SaaS Admin (P0, internal)
38. Tenant list
39. Tenant detail
40. Metrics dashboard
41. Support inbox

---

## B. Critical user flows (step by step)

### FLOW 1 — New Admission (sabse zyada use hone wala flow)
**Target: 60 seconds me complete ho**

```
[Dashboard] → "+ New Admission" button
   ↓
Step 1: Student details
   - Mobile number daalo → agar exist karta hai to auto-fill + warning
   - Name, Photo (camera icon → capture), Guardian mobile
   - "Next"
   ↓
Step 2: Seat & Plan
   - Shift chuno (chips: Morning / Noon / Evening / Full Day)
   - Available seats grid dikhega (sirf us shift ki khaali seats)
   - Seat pe tap → selected
   - Plan chuno (1M / 3M / 6M) → amount auto
   - Start date (default: aaj)
   - End date auto-calculated dikhe
   ↓
Step 3: Payment
   - Plan amount: ₹800
   - + Registration: ₹100
   - + Security deposit: ₹500
   - − Discount: [___] reason [___]
   - = Total: ₹1,400
   - Paying now: ₹1,400 (editable → partial)
   - Mode: [Cash] [UPI] [Card] [Other]
   - "Save & Print Receipt"
   ↓
Success screen:
   - ✅ Ram Kumar, Seat S-24, Morning shift, valid till 15 Oct 2026
   - [Print] [WhatsApp receipt] [Add another student] [Done]
   - Background me: welcome WhatsApp auto-sent
```

**Design rules:**
- Har step pe sirf zaroori fields, baaki "More details" ke andar chhupe
- Numeric keypad mobile pe auto-open ho amount/mobile fields pe
- Photo optional — skip karna aasan ho

---

### FLOW 2 — Fee Collection (roz 20-30 baar hoga)
```
Option A: Search bar me naam/mobile/seat daalo → student card → "Collect Fee"
Option B: Due Students list → student ke saamne "Collect" button
   ↓
Modal khule:
   - Student name, seat, due amount bada dikhe
   - Amount field (pre-filled with full due, editable)
   - Mode buttons: [Cash ✓] [UPI] [Card] [Bank]
   - Note (optional)
   - [Collect ₹800]
   ↓
   - Receipt turant, WhatsApp auto-send
   - Modal band, list refresh
```
**3 tap ka target: Search → Collect → Confirm**

---

### FLOW 3 — Renewal
```
Dashboard → "Expiring (12)" card pe click
   ↓
List: naam, seat, expiry date, amount
   ↓
"Renew" button → modal
   - Plan pre-selected (last wala)
   - New period: 16 Oct - 15 Nov (auto)
   - Amount, discount, payment
   - [Renew & Collect]
   ↓
Done. Seat wahi rehti hai.
```

---

### FLOW 4 — Seat Change / Shift Change
```
Student profile → "Change Seat"
   ↓
Current: S-24 (Morning)
New shift: [dropdown] → available seats grid
Select S-40
Effective from: [date]
   ↓
System check:
   - Purani seat_allocation ka to_date = effective_date - 1
   - Nayi allocation banao
   - Agar shift ka rate alag hai → difference calculate karo
     (upgrade = extra charge, downgrade = credit note)
   ↓
[Confirm] → WhatsApp: "Aapki nayi seat S-40 hai"
```

---

### FLOW 5 — Student Leaving
```
Student profile → "Mark as Left"
   ↓
- Leaving date
- Due amount: ₹200 (show)
- Security deposit: ₹500 (show)
- Adjustment: 500 − 200 = ₹300 refundable
- Refund mode: [Cash/UPI]
- Reason: [dropdown: Exam done / Shifted city / Price / Facility issue / Other]
   ↓
[Confirm & Refund]
   ↓
- Seat immediately available ho jaati hai
- Student status = Left
- Exit feedback WhatsApp (optional)
```

---

### FLOW 6 — Daily Attendance (QR)
```
Gate pe tablet: /attendance/scan page fullscreen
   ↓
Student apna QR dikhata hai → camera scan
   ↓
Screen pe 2 second: "✅ Ram Kumar — IN 8:32 AM — Seat S-24"
   ↓
Shaam ko dobara scan → "👋 Ram Kumar — OUT 2:10 PM — 5h 38m"
```
Edge case: bhool gaya scan out karna → day end pe shift end time auto-mark (configurable)

---

### FLOW 7 — Owner ka daily routine (ye design karo)
```
Subah: phone kholo → Dashboard
   - "Aaj 3 students expire ho rahe hain"
   - "Kal ₹4,200 collect hua"
   - "5 students 3 din se nahi aaye"
Shaam 9 PM: WhatsApp pe auto summary
   "Aaj: ₹5,600 collection | 2 naye admission | ₹18,400 total due | 88% occupancy"
```
Agar owner ko roz value milegi to wo churn nahi karega.

---

## C. Design principles

1. **Mobile-first** — owner phone se hi zyada chalayega. Desktop bhi acha ho par mobile
   pe sab kuch ho sake.
2. **Bade buttons, bada font** — 45+ age group user hai
3. **Hindi toggle top-right** — poora UI translate ho
4. **Colors:** Primary blue/indigo (trust), Green (paid/available), Red (due/occupied),
   Amber (expiring)
5. **Har list pe search sabse upar** — owner naam se hi dhoondhta hai
6. **Confirmation dialog** sirf destructive actions pe (delete, refund) — warna flow tootta hai
7. **Loading skeleton** dikhao, blank screen nahi — slow internet pe zaroori
8. **Offline banner** — “Internet nahi hai.” Write-queue / sync **Phase 2** (`10`).
   Banner me “entries save ho rahi hain” mat likho jab tak queue na ho.
9. **Empty states me action** — "Abhi koi student nahi. [Pehla student add karo]"
10. **Error messages Hindi me bhi** — "Ye seat is shift me pehle se booked hai"
11. **Thermal 58mm:** OS driver installed ho to Chrome print dialog + CSS
    `@page { size: 58mm auto }` kaafi hai. Raw ESC/POS agent **optional**, blocker nahi.

---

## D. Navigation structure

```
Sidebar (desktop) / Bottom tabs (mobile):
  🏠 Dashboard
  🪑 Seats
  👥 Students
  💰 Fees        → Collect | Due | Payments | Invoices
  📅 Attendance
  📊 Reports
  ⚙️  More        → Expenses | Leads | Complaints | Lockers | Settings | Staff

Top bar: [Branch selector] [Search] [Notifications] [Language] [Profile]
Floating action button (mobile): "+ New Admission"
```
