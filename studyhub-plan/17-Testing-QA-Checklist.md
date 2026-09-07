# 17 — Testing & QA Checklist

## 1. Test pyramid

| Level | Kya test karo | Tool | Coverage target |
|---|---|---|---|
| Unit | Business logic (dates, proration, allocation, payment split) | Jest | 80%+ |
| Integration | API endpoints with real DB | Jest + Supertest | Critical paths 100% |
| E2E | User journeys | Playwright | Top 8 flows |
| Manual | UX, edge cases, devices | Human | Har release |

---

## 2. Unit tests — MUST HAVE (ye logic galat hui to paisa galat hoga)

### Date calculations
- [ ] 1 month from 5 Sep → 4 Oct
- [ ] 1 month from 31 Jan → 28 Feb (non-leap) — **not** 27 Feb
- [ ] 1 month from 31 Jan 2028 → 29 Feb (leap)
- [ ] 1 month from 29 Feb 2028 → 31 Mar (29 Feb last day of Feb → last day of Mar)
- [ ] 30 days from 5 Sep → 4 Oct
- [ ] 3 months from 30 Nov → 28/29 Feb (30 Nov last day of Nov)
- [ ] Overnight shift date rollover (check-in date, not checkout date)

### Proration
- [ ] Mid-month join, daily rate calculation
- [ ] Rounding: ₹800/30 days × 11 days = ₹293 (not 293.33)
- [ ] Zero days remaining edge case
- [ ] Upgrade mid-cycle price difference
- [ ] Downgrade credit calculation

### Seat allocation
- [ ] Same seat + same shift + overlapping dates → REJECT
- [ ] Same seat + different shift + overlapping → ALLOW
- [ ] Same seat + same shift + adjacent (no overlap) → ALLOW
- [ ] Full-day membership blocks all shifts on that seat
- [ ] Existing partial-shift booking blocks full-day
- [ ] Released allocation doesn't block new booking

### Payment allocation
- [ ] ₹500 payment across 2 invoices (₹300 + ₹400) → 300 paid, 400 partial(200)
- [ ] Exact amount → invoice paid
- [ ] Overpayment → advance credit created
- [ ] Refund reduces deposit ledger correctly
- [ ] Payment reversal restores invoice status

### Pause/resume
- [ ] 10-day pause extends end_date by exactly 10
- [ ] Pause + resume + pause again accumulates correctly
- [ ] Resume that would overlap next booking → error
- [ ] Max pause days limit enforced

### Deposit settlement
- [ ] Deposit ₹500, due ₹200 → refund ₹300
- [ ] Deposit ₹500, due ₹700 → refund 0, remaining due ₹200
- [ ] Deposit ₹500, due ₹500 → refund 0, no remaining

### Money
- [ ] All amounts stored as integers (no float anywhere)
- [ ] Percentage discount converts to correct paise amount
- [ ] Total = base − discount + registration + deposit

### Expiry / renewal
- [ ] days_left 6,4,2 pe membership.status = expiring (not active)
- [ ] renew start_from=today while old still valid → old superseded, no overlapping allocation
- [ ] renew start_from=expiry → old stays active until end_date

### Attendance
- [ ] Lunch out + wapas = doosri row (same date, two sessions)
- [ ] Second open session rejected (partial unique)
- [ ] Overnight: in 22:00 date D, out 06:00 D+1, attendance_date = D
- [ ] Scan on D+1 morning closes open overnight session, does not look up by "today"

---

## 3. Integration tests — critical paths

- [ ] Signup → tenant created → trial subscription active
- [ ] Full admission: student + membership + allocation + invoice + payment + receipt
      (verify all rows in ONE transaction; force an error mid-way → all rolled back)
- [ ] Concurrent admission to same seat+shift → one succeeds, one gets 409
      (ye race condition test zaroor likho)
- [ ] Renewal creates new membership, links previous, extends allocation
- [ ] Seat change closes old allocation, opens new, calculates price diff
- [ ] Expiry cron: status transitions active→expiring→expired→seat released
- [ ] Reminder cron: dedupe key prevents double send when cron runs twice
- [ ] Plan limit: 101st student on Starter plan → 402 error
- [ ] Credit exhaustion: promotional blocked, transactional allowed
- [ ] Webhook idempotency: same Razorpay event twice → one payment row

---

## 4. Tenant isolation test suite (SECURITY CRITICAL)

Ye suite har endpoint pe automated chale. Ek bhi leak = disaster.

```typescript
describe('Tenant Isolation', () => {
  // For EVERY resource type
  const resources = ['students','memberships','payments','invoices','seats',
                     'shifts','expenses','attendance','staff','reports'];

  resources.forEach(resource => {
    it(`Tenant A cannot GET Tenant B's ${resource}`, async () => {
      const res = await request(app)
        .get(`/v1/${resource}/${tenantB_resource_id}`)
        .set('Authorization', `Bearer ${tenantA_token}`);
      expect(res.status).toBe(404);   // 403 nahi — 404, existence bhi mat batao
    });

    it(`Tenant A cannot UPDATE Tenant B's ${resource}`, async () => { ... });
    it(`Tenant A cannot DELETE Tenant B's ${resource}`, async () => { ... });
    it(`Tenant A list does not contain Tenant B's ${resource}`, async () => {
      const res = await request(app).get(`/v1/${resource}`)
        .set('Authorization', `Bearer ${tenantA_token}`);
      expect(res.body.data.every(r => r.tenant_id === tenantA_id)).toBe(true);
    });
  });

  it('RLS blocks even if code forgets the where clause', async () => {
    await setTenantContext(tenantA_id);
    const rows = await prisma.$queryRaw`SELECT * FROM students`;  // no filter!
    expect(rows.every(r => r.tenant_id === tenantA_id)).toBe(true);
  });
});
```

---

## 5. E2E flows (Playwright)

- [ ] Signup → OTP → setup wizard (all 5 steps) → dashboard
- [ ] New admission → seat selected → payment → receipt visible
- [ ] Search student → collect fee → due reduces
- [ ] Renewal from expiring list
- [ ] Seat change
- [ ] Mark student left with refund
- [ ] QR scan attendance (mock camera)
- [ ] Generate report → download Excel
- [ ] Upgrade plan flow
- [ ] Language toggle: sab strings Hindi me badalti hain

---

## 6. Manual QA checklist (har release se pehle)

### Devices
- [ ] Android Chrome (low-end phone — Redmi/Realme, 3GB RAM)
- [ ] Android Chrome (mid-range)
- [ ] iPhone Safari
- [ ] Desktop Chrome 1920×1080
- [ ] Desktop 1366×768 (chhoti screen — bahut common hai)
- [ ] Tablet (attendance scanner ke liye)

### Network conditions
- [ ] 3G slow (Chrome DevTools throttle) — pages load ho rahe hain?
- [ ] Offline → online — sync kaam kar raha hai?
- [ ] Request timeout — proper error message aa raha hai?

### Data edge cases
- [ ] 0 students (empty state)
- [ ] 1 student
- [ ] 2,000 students (pagination, search speed)
- [ ] 500 seats (seat map render speed)
- [ ] Bahut lamba naam (50 chars) — layout toot to nahi raha
- [ ] Hindi/Devanagari naam
- [ ] Special characters in name (O'Brien, S/O)
- [ ] Amount ₹0
- [ ] Amount ₹9,99,999
- [ ] Negative scenarios: past date, future date beyond 5 years

### Business scenarios (ye owner ke real cases hain)
- [ ] Student ek shift se doosri shift me jaaye
- [ ] Student 15 din baad wapas aaye (expired) — renewal kaise hota hai
- [ ] Do bhai ek hi mobile number pe
- [ ] Student ne aadha paisa diya, baaki 10 din baad
- [ ] Seat maintenance me daali, student ko doosri seat
- [ ] Full-day student ne shift-wise pe switch kiya
- [ ] Staff ne galat payment entry ki, owner ne reverse kiya
- [ ] Library ne shift ka timing badla (existing memberships pe kya asar)
- [ ] Owner ne fee plan ka rate badla (purane students pe asar nahi hona chahiye)

### Permissions
- [ ] Staff account se owner-only actions hidden + API pe bhi blocked
- [ ] Manager discount limit se zyada nahi de sakta
- [ ] Accountant student edit nahi kar sakta

### Notifications
- [ ] Welcome message actual number pe pahuncha
- [ ] Receipt PDF link khulta hai
- [ ] Reminder cron dobara chale to duplicate nahi gaya
- [ ] Quiet hours respect ho raha hai
- [ ] Credits deduct ho rahe hain

### Print
- [ ] A4 receipt print preview theek hai
- [ ] Thermal 58mm receipt (actual printer pe test karo)
- [ ] Student ID card print

---

## 7. Load testing (k6)

```javascript
// k6 run load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up
    { duration: '5m', target: 100 },  // sustained
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800', 'p(99)<2000'],
    http_req_failed:   ['rate<0.01'],
  },
};

export default function () {
  const headers = { Authorization: `Bearer ${__ENV.TOKEN}` };
  check(http.get(`${__ENV.API}/v1/dashboard`, { headers }), { 'dashboard 200': r => r.status === 200 });
  check(http.get(`${__ENV.API}/v1/students?page=1`, { headers }), { 'students 200': r => r.status === 200 });
  check(http.get(`${__ENV.API}/v1/seats/map`, { headers }), { 'seatmap 200': r => r.status === 200 });
  sleep(1);
}
```

**Targets:** p95 <800ms, p99 <2s, error rate <1% at 100 concurrent users.
Agar fail ho to: slow query log dekho → missing index → N+1 query → caching add.

---

## 8. Pre-launch go/no-go checklist

**Data safety**
- [ ] Backup script chal raha hai, verified
- [ ] Restore drill successfully kiya gaya
- [ ] Healthcheck dead-man's switch active

**Security**
- [ ] Tenant isolation suite 100% pass
- [ ] `npm audit` — no high/critical
- [ ] Trivy scan clean
- [ ] Secrets Git history me nahi (gitleaks scan)
- [ ] Rate limits verified
- [ ] HTTPS + security headers verified (securityheaders.com A grade)

**Functionality**
- [ ] Sab E2E flows pass
- [ ] Manual QA checklist complete
- [ ] WhatsApp templates approved aur real number pe test kiye
- [ ] Payment gateway test mode + live mode dono verified
- [ ] Receipt PDF sahi dikhta hai (A4 + thermal)

**Operations**
- [ ] Monitoring + alerts configured aur test kiye (fake alert trigger karo)
- [ ] Sentry errors aa rahe hain
- [ ] Rollback procedure test kiya
- [ ] Status page ready
- [ ] Support WhatsApp number active

**Legal**
- [ ] Privacy policy + T&C published
- [ ] Refund policy published
- [ ] Consent notice at student registration

**Business**
- [ ] Pricing page live
- [ ] Onboarding videos (3-4 short Hindi videos) ready
- [ ] Help docs (10 common questions)
- [ ] Demo account with sample data
