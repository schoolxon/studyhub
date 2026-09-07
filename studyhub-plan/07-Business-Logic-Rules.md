# 07 — Business Logic Rules (exact algorithms)

Ye document sabse zyada important hai developers ke liye. Yahi wo cheezein hain jahan
har library software fail hota hai.

---

## 1. Seat Sharing & Double-Booking Prevention

**Rule:** Ek seat, ek shift, ek time period me sirf ek student.
Alag shift me same seat doosre student ko de sakte ho.

### Implementation
DB level pe guarantee lo (application logic pe bharosa mat karo — race condition aayegi):

```sql
CONSTRAINT no_double_booking EXCLUDE USING gist (
    seat_id WITH =, shift_id WITH =, period WITH &&
) WHERE (released_at IS NULL)
```

### Full-day shift ka special case
Agar `shift.is_full_day = true` hai, to us seat ki **saari shifts** block karni hain.
Solution: full-day membership banate waqt har active shift ke liye ek
`seat_allocations` row banao.

```
allotFullDay(seat, period):
    for shift in active_shifts(branch) where not shift.is_full_day:
        insert seat_allocation(seat, shift, period)
    insert seat_allocation(seat, full_day_shift, period)
```

### Availability check
```sql
SELECT s.* FROM seats s
WHERE s.branch_id = :branch AND s.status = 'available' AND s.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1 FROM seat_allocations a
    WHERE a.seat_id = s.id
      AND a.released_at IS NULL
      AND a.period && daterange(:from_date, :to_date, '[)')
      AND (a.shift_id = :shift_id
           OR a.shift_id IN (SELECT id FROM shifts WHERE is_full_day AND branch_id=:branch)
           OR :is_full_day = true)
);
```

---

## 2. Membership Date Calculation

```
end_date = start_date + duration - 1 day
```

| Plan | Start | End |
|---|---|---|
| 1 month | 5 Sep 2026 | 4 Oct 2026 |
| 3 months | 5 Sep 2026 | 4 Dec 2026 |
| 30 days | 5 Sep 2026 | 4 Oct 2026 |

**Month-end (frozen):** `addMonths` then `-1 day` **mat** use karo — `addMonths(31 Jan, 1)`
pehle 28 Feb pe clamp hota hai, phir −1 = **27 Feb**, jo is table se ladta hai.

Do cases:

1. Start mahine ka **last day** hai (31 Jan, 30 Nov) → end = target month ka last day
   (31 Jan + 1 month = **28 Feb** / 29 leap).
2. Warna → anniversary minus 1 day (5 Sep + 1 month = **4 Oct**).

```javascript
function calcEndDate(startDate, plan) {
  if (plan.duration_days) {
    return addDays(startDate, plan.duration_days - 1);
  }
  const n = plan.duration_months;
  const y = startDate.getUTCFullYear();
  const m = startDate.getUTCMonth();
  const d = startDate.getUTCDate();
  const lastOfStart = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  if (d === lastOfStart) {
    return new Date(Date.UTC(y, m + n + 1, 0)); // last day of start-month + n
  }
  return addDays(new Date(Date.UTC(y, m + n, d)), -1);
}
```

Unit tests: `17-Testing-QA-Checklist.md` — 31 Jan→28 Feb, 5 Sep→4 Oct, 30 Nov+3m→28/29 Feb.

---

## 3. Proration (mid-month join)

Agar library ka model "har mahine 1 tarikh se" hai to mid-month join pe adjust karna
padega.

**Method A — Daily rate (default, sabse fair):**
```
daily_rate    = plan_amount / days_in_plan_period
days_remaining = end_of_cycle - join_date + 1
amount_due    = round(daily_rate * days_remaining)
```
Example: ₹800/month, 20 Sep ko join, cycle 30 Sep tak
```
daily = 800/30 = 26.67
days  = 11
due   = ₹293
```

**Method B — Full cycle from join date (recommended for most libraries):**
Student jis din join kare, us din se poora mahina. Simplest, students samajhte hain,
proration ki zarurat hi nahi. **MVP me yahi default rakho.**

Setting: `billing_model: "anniversary" | "calendar_month"`

---

## 4. Membership Pause / Freeze

Student ghar gaya / exam dene gaya — days extend karo.

```
pause(membership, pause_date):
    membership.paused_from = pause_date
    membership.status = 'paused'
    student.status = 'paused'
    # seat hold rakho (allocation release mat karo) — warna wapas aake seat nahi milegi

resume(membership, resume_date):
    paused_days = resume_date - membership.paused_from
    membership.original_end_date = membership.original_end_date ?? membership.end_date
    membership.end_date += paused_days
    membership.paused_days_total += paused_days
    membership.paused_from = NULL
    membership.status = 'active'
    # seat_allocation.period ka upper bound bhi extend karo
    # AGAR extend karne se doosre allocation se overlap ho raha hai -> error dikhao
    #   "Ye seat aage book ho chuki hai, doosri seat chunni padegi"
```

**Rules:**
- Max pause days limit (default 30, setting me configurable)
- Pause ke dauran seat hold hoti hai. **MVP hold charge = ₹0/day**
  (`membership_pauses.hold_charge_paise` default 0). Non-zero billing is a
  later setting, not implied.
- Ek membership me max 2 pause allowed (abuse rokne ke liye)

---

## 5. Expiry, Grace Period & Auto-release

Daily cron 6:00 AM:
```
FOR each membership WHERE status IN ('active','expiring'):
    days_left = end_date - today   # 0 = aaj last day

    # STATUS: range, sparse days nahi — warna 6/4/2 pe flicker (active dikhe)
    if days_left >= 1 AND days_left <= 7:
        membership.status = 'expiring'
    if days_left < 0:
        membership.status = 'expired'
        # student.status 'expired' MAT likho — students.status coarse hai
        # (active|paused|left|blacklisted). Lists derive from memberships.

    # REMINDERS: in days pe queue (dedupe_key se double-send nahi)
    if days_left in (7, 5, 3, 1, 0): queue fee reminder
    if days_left == -3:              queue overdue to student + guardian
    if days_left == -7:              queue expired/seat-released copy if released

    if days_left < 0 AND abs(days_left) >= GRACE_PERIOD_DAYS (default 3):
        seat_allocation.released_at = now()
        notify owner + waiting_list
```

**Grace period kyun:** student 2 din late aata hai, agar seat turant kisi aur ko de di
to jhagda hoga. Default 3 din, setting me 0-15 configurable.

---

## 6. Seat / Shift Change Mid-Period

```
changeSeat(membership, new_seat, new_shift, effective_date):
    BEGIN TRANSACTION

    # 1. Purani allocation ko effective_date pe band karo
    UPDATE seat_allocations
      SET period = daterange(lower(period), effective_date, '[)'),
          released_at = now()
      WHERE membership_id = :m AND released_at IS NULL

    # 2. Nayi allocation banao (exclusion constraint apne aap validate karega)
    INSERT seat_allocations(seat=new_seat, shift=new_shift,
                            period=[effective_date, membership.end_date+1))

    # 3. Price difference
    old_daily = membership.base_amount / total_days
    new_daily = new_plan.amount / total_days
    remaining_days = membership.end_date - effective_date + 1
    diff = round((new_daily - old_daily) * remaining_days)

    if diff > 0:  create invoice line "Shift upgrade charge" ₹diff
    if diff < 0:  create credit note / adjust next renewal

    # 4. Update membership
    membership.seat_id = new_seat; membership.shift_id = new_shift

    COMMIT
    notify student: "Aapki nayi seat S-40 hai, Evening shift"
```

---

## 7. Student Leaving & Deposit Settlement

```
markLeft(student, leave_date, reason):
    total_due     = SUM(invoices.due_amount) WHERE student
    deposit_held  = SUM(deposits.amount) WHERE student   # net

    refundable = deposit_held - total_due

    if refundable > 0:
        create deposit entry (type='refunded', amount = -refundable)
        create payment entry (is_refund=true, amount=refundable)
    if refundable < 0:
        # deposit se bhi zyada due hai
        create deposit entry (type='adjusted', amount = -deposit_held)
        remaining_due = abs(refundable)
        show warning: "₹remaining_due abhi bhi baaki hai"
    if refundable == 0:
        create deposit entry (type='adjusted', amount = -deposit_held)

    release all seat_allocations
    release locker if assigned
    student.status = 'left'; student.left_on = leave_date; student.left_reason = reason
    membership.status = 'cancelled'
```

---

## 8. Renewal Logic

```
renew(membership, plan, start_from):
    if start_from == 'expiry':
        new_start = membership.end_date + 1 day
        # purani membership cron tak active/expiring rehti hai — aaj expire MAT karo
        # naya allocation [new_start, new_end] — aaj se overlap nahi
        old_close = false
    else:  # 'today'
        new_start = today
        if today <= membership.end_date:
            # overlap rokne ke liye purani term aaj se pehle band
            membership.end_date = today - 1 day
            membership.status = 'superseded'
            UPDATE seat_allocations SET period = daterange(lower(period), today, '[)'),
                released_at = now() WHERE membership_id = old AND released_at IS NULL
            old_close = true
        else:
            membership.status = 'expired'
            old_close = true

    new_end = calcEndDate(new_start, plan)
    if seat NOT available for (seat, shift, [new_start, new_end+1)):
        error: "Ye seat aage book ho chuki hai, doosri seat chuno"

    create new membership (is_renewal=true, previous_membership_id=old.id, status=active)
    create new seat_allocation
    create invoice + collect payment
```

`start_from='today'` pe purani membership ko `expired` chhodna **galat** tha —
allocation overlap + double-active membership. Supersede + period close.

**Gap handling:** agar student 10 din late renew kare aur `start_from='expiry'` chune,
to wo 10 din ka paisa de raha hai bina use kiye. Owner ko choice do, default `'today'`
recommend karo par owner ki setting rakho.

---

## 9. Invoice & Receipt Numbering

```
Invoice:  INV/{FY}/{branch_code}/{seq}   e.g. INV/2627/AMB/0042
Receipt:  RCP/{FY}/{branch_code}/{seq}

FY = Indian financial year: Apr-Mar. 2026-27 -> "2627"
```

**Race condition se bacho:** sequence generate karne ke liye
`SELECT ... FOR UPDATE` ya Postgres sequence per tenant use karo. String concat karke
`MAX(seq)+1` mat karo — concurrent admission pe duplicate aayega.

```sql
-- per tenant counter table with row lock
UPDATE counters SET last_no = last_no + 1
WHERE tenant_id = :t AND type = 'invoice' AND fy = :fy
RETURNING last_no;
```

---

## 10. Payment Allocation (partial payments)

Student ne ₹500 diye, uski 2 invoices unpaid hain (₹300 aur ₹400).

**Rule: oldest invoice first (FIFO).**
```
allocatePayment(student, amount):
    invoices = SELECT * FROM invoices
               WHERE student_id=:s AND status IN ('unpaid','partial')
               ORDER BY invoice_date ASC, created_at ASC

    remaining = amount
    for inv in invoices:
        pay = min(remaining, inv.due_amount)
        inv.paid_amount += pay
        inv.status = (inv.paid_amount >= inv.total_amount) ? 'paid' : 'partial'
        remaining -= pay
        if remaining == 0: break

    if remaining > 0:
        create advance row in student_advances (amount=remaining)
```

---

## 11. Discount Rules

- Discount amount ya % — internally hamesha amount me convert karke store karo
- `discount_reason` mandatory
- Staff ka `max_discount_paise` check — exceed kare to owner approval flow (P1)
- Discount activity_log me record ho (kaunse staff ne kitna diya) — cash leakage rokne
  ka sabse bada tool

---

## 12. Attendance Logic

```
scan(qr_token, branch, device):
    student = findByQrToken(qr_token)
    if not student: error "Invalid QR"
    # entry membership-level check: koi active/expiring membership?
    # students.status 'expiring' store nahi — warn if no live membership, par allow

    # OPEN session: check_out IS NULL (date se mat dhoondo — overnight midnight)
    open = attendance WHERE student_id AND check_out IS NULL

    if open:
        if now - open.check_in < 5 minutes: return {action:'ignored'}  # bounce
        open.check_out = now
        open.duration_minutes = diff
        return {action:'out', duration}

    # nayi session (lunch ke baad wapas, ya pehli entry)
    # attendance_date = check_in ki date in tenant TZ (overnight: 3AM out kal ki date nahi)
    create(check_in=now, attendance_date=localDate(now), method='qr')
    return {action:'in', time}
```

UNIQUE(student_id, attendance_date) **nahi** — lunch out + wapas doosri row.
Partial unique: ek student pe ek hi open session (`idx_att_open_session`).

**Auto-checkout:** open sessions (`check_out IS NULL`) — overnight shift ke `end_time`
next calendar morning pe; normal shift usi din `end_time`. `is_auto_checkout = true`.

**Overnight:** in 10:00 PM 7 Sep, out 6:00 AM 8 Sep → ek row, `attendance_date=2026-09-07`.
Subah 8 Sep ki nayi entry tabhi jab ye row close ho (out ya auto-checkout).

---

## 13. Duplicate Mobile Handling

Bhai-behen ka ek hi number ho sakta hai. Isliye:
- Mobile pe **unique constraint mat lagao**
- Admission pe warning dikhao: "Is number se pehle se Ram Kumar registered hai. Fir bhi
  aage badhein?" → [Haan, alag student hai] [Nahi, wahi student hai]
- Notification bhejte waqt naam include karo taki confusion na ho

---

## 14. Plan Limit Enforcement (SaaS)

```
before creating student:
    active_count = COUNT(students WHERE status != 'left' AND deleted_at IS NULL)
    if active_count >= plan.max_students:
        throw PLAN_LIMIT_EXCEEDED with upgrade CTA

before sending notification:
    if credits[channel] <= 0:
        throw INSUFFICIENT_CREDITS
    else: decrement + write credit_ledger row
```

**Important:** limit hit hone pe **existing data lock mat karo**. Owner ko naya student
add karne se roko, par purana data hamesha dikhao aur export karne do. Warna wo tumse
nafrat karega aur review kharaab karega.

---

## 15. Timezone Handling

- DB me sab `timestamptz` (UTC)
- Har tenant ka `timezone` field (default `Asia/Kolkata`)
- "Aaj ka collection" = tenant timezone ke hisaab se midnight-to-midnight, UTC se nahi
```sql
WHERE paid_at >= (date_trunc('day', now() AT TIME ZONE :tz) AT TIME ZONE :tz)
```
- Cron jobs tenant timezone me chalein (ya IST me, agar sirf India target hai)

---

## 16. Money Handling

- **Hamesha paise (integer) me store karo.** ₹800 = `80000`
- Kabhi float mat use karo — `0.1 + 0.2 !== 0.3`
- Display pe hi rupees me convert karo: `amount / 100`
- Rounding: proration me `Math.round()`, hamesha nearest rupee (paise se students ko
  confusion hota hai)

---

## 17. Soft Delete Rules

| Entity | Delete behaviour |
|---|---|
| Student | Soft delete, seat release, membership cancel |
| Payment | **Kabhi delete nahi** — reverse entry banao (audit trail) |
| Invoice | Cancel status, delete nahi |
| Seat | Soft delete only if koi active allocation nahi |
| Shift | Soft delete only if koi active membership nahi |
| Staff | Soft delete, uske entries intact rahenge |
