# 14 — Pricing & SaaS Billing

**GST:** saari list prices **exclusive of GST (18%)**. Marketing copy: “₹499/mahina
+ GST”. Invoice pe CGST/SGST split. Model ke ARPU figures ex-GST hain (GST
pass-through hai, margin nahi).

**White-label SKU (frozen):** ₹4,999/month + ₹15,000 setup. Phase 3 doc me koi
₹999–2,999 wala number nahi — wo leftover tha.

## 1. Plan structure

| | Trial | Starter | Growth | Pro | White Label |
|---|---|---|---|---|---|
| **Monthly (ex-GST)** | Free 14d | ₹499 | ₹999 | ₹1,999 | ₹4,999 |
| **Monthly (incl. GST)** | — | ₹589 | ₹1,179 | ₹2,359 | ₹5,899 |
| **Yearly** (2 mo free, ex-GST) | — | ₹4,990 | ₹9,990 | ₹19,990 | ₹49,990 |
| Branches | 1 | 1 | 2 | 10 | Unlimited |
| Students | 30 | 100 | 300 | Unlimited | Unlimited |
| Staff accounts | 2 | 2 | 5 | 20 | Unlimited |
| WhatsApp credits/mo | 100 | 500 | 2,000 | 5,000 | 10,000 |
| SMS credits/mo | 50 | 300 | 1,000 | 3,000 | 5,000 |
| Seat map + sharing | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fees, invoices, receipts | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR attendance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto reminders | ✅ | ✅ | ✅ | ✅ | ✅ |
| Basic reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expense + P&L | ✅ | ✅ | ✅ | ✅ | ✅ |
| Student mobile app | ❌ | ❌ | ✅ | ✅ | ✅ |
| Online payment / UPI AutoPay | ❌ | ❌ | ✅ | ✅ | ✅ |
| Biometric integration | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lead CRM + waiting list | ❌ | ❌ | ✅ | ✅ | ✅ |
| Lockers, complaints | ❌ | ❌ | ✅ | ✅ | ✅ |
| GST invoicing | ❌ | ❌ | ❌ | ✅ | ✅ |
| Advanced/custom reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| API access + webhooks | ❌ | ❌ | ❌ | ✅ | ✅ |
| Branded Android app | ❌ | ❌ | ❌ | ❌ | ✅ |
| Custom domain | ❌ | ❌ | ❌ | ❌ | ✅ |
| Support | Chat | Chat | Chat + Call | Priority | Dedicated |
| "Powered by StudyHub" on receipt | Yes | Yes | Yes | No | No |

## 2. Add-ons

| Add-on | Price |
|---|---|
| Extra 1,000 WhatsApp credits | ₹299 |
| Extra 1,000 SMS credits | ₹249 |
| Extra branch | ₹399/month |
| Custom domain (non-whitelabel) | ₹499/month |
| Branded app setup (one-time) | ₹15,000 |
| Data migration from Excel | Free (Growth+), ₹999 (Starter) |
| On-site training | ₹2,000/visit |
| Featured marketplace listing (Ph3) | ₹500-2,000/month |

## 3. Pricing psychology (India-specific)

- **₹499 magic number** — ₹500 se kam lagta hai, mahine ka ek student ki fees se bhi kam.
  Pitch me GST alag se bolo, chhupao mat — ₹589 incl. GST pe pehle se taiyar raho.
- Frame karo student ke terms me: "ek student ki mahine ki fees me pura software"
- Annual push karo — cash flow milega aur churn 60% kam ho jaata hai
- Discount kabhi permanent mat do; "3 mahine ka offer" karo
- Setup fee mat lagao MVP me — barrier badhta hai
- Trial me card mat maango — India me card add karna huge friction hai

## 4. Trial design

- **14 din**, **Starter-equivalent P0 features** unlocked (expense/P&L included),
  30 students limit. Student app / UPI AutoPay / biometric locked rahenge — wo
  Growth+ hain, trial me “sab” ka matlab P0 register-replacement hai.
- Card nahi maanga jaata
- Day 1: welcome + setup call offer
- Day 3: "kaise chal raha hai?" WhatsApp (personal, automated nahi lagna chahiye)
- Day 7: usage-based nudge ("aapne 12 students add kiye, ab attendance try karein")
- Day 11: "3 din bache hain" + plan comparison
- Day 13: last day reminder + limited offer (pehle mahine 50% off)
- Day 15: expire → **read-only mode** (data dikhta rahe, entry band)
- Day 15-45: reactivation campaign (weekly)
- Day 45: data archive (par delete mat karo, 6 mahine tak rakho)

**Extend karne ka option do** agar owner busy tha — 7 din free extension maang le to
de do. Wo grateful hoga.

## 5. Dunning (payment fail hone pe)

| Day | Action |
|---|---|
| 0 | Payment fail → retry immediately, WhatsApp + email |
| 1 | Retry #2 + reminder |
| 3 | Retry #3 + "sewa band ho jayegi" warning |
| 5 | Retry #4 + phone call (Pro/White label ko) |
| 7 | Final warning |
| 10 | **Read-only mode** (suspend, delete nahi) |
| 30 | Downgrade to free archive |
| 90 | Data export link bhejo, phir archive |

**Kabhi mat karo:** data delete, data hide, ya login block. Owner ka business data hai —
usse rokoge to wo tumhari review mein 1-star dega aur sabko batayega.

## 6. Upgrade triggers (in-app)

Ye moments pe upgrade prompt dikhao (natural hai, pushy nahi):
- 90 students ho gaye (Starter limit 100) → "10 seats bachi hain"
- Doosri branch add karne ki koshish
- WhatsApp credits 80% khatam
- Student app feature pe click (locked)
- Online payment page pe click (locked)
- 3 mahine se active use → "aapne ₹4.5 lakh collect track kiya, Growth me AutoPay bhi hai"

## 7. Billing implementation

### Data model
`saas_plans` → `subscriptions` → `saas_invoices` (schema file dekho)

### Razorpay Subscriptions
```
1. Plan create (Razorpay dashboard ya API)
2. Subscription create → checkout link
3. Customer authorize (UPI mandate / card)
4. Har cycle pe Razorpay auto-charge
5. Webhook: subscription.charged → invoice paid mark karo, period extend
6. Webhook: subscription.pending / halted → dunning shuru
```

### Webhook handling (critical)
- Signature verify karo (HMAC)
- **Idempotent** — same event 2 baar aa sakta hai, `event_id` store karo
- Async process karo (queue me daalo, 200 turant return karo)
- Failed webhook ke liye reconciliation cron (roz Razorpay se status match karo)

### Proration on upgrade
```
remaining_days = current_period_end - today
unused_credit  = (old_plan_amount / cycle_days) * remaining_days
new_charge     = new_plan_amount - unused_credit
```
Ya simpler: upgrade turant, naya cycle aaj se shuru. Chhote amounts pe complexity
add karne ka fayda nahi.

## 8. Revenue projections

**Is table ko mat use karo planning ke liye.** Canonical funnel `18-Financial-Model.md`
me hai. Mirror (base case, ex-GST):

| Calendar month | Customers | ARPU | MRR | Notes |
|---|---|---|---|---|
| 1–5 | 0 | — | ₹0 | Build + 5-library pilot |
| 6 (launch) | 8 | ₹600 | ₹4,800 | First paid |
| 8 | 35 | ₹700 | ₹24,500 | |
| 9 | 52 | ₹750 | ₹39,000 | Phase 2 starts overlapping |
| 12 | 127 | ₹830 | ₹1,05,410 | **Year-1 base exit** |
| 18 | see `18` Y2 | ₹1,100 | ramp | Do not quote 300 @ M12 |

Aggressive M12: ~180 paying / ~₹1.6L MRR. Conservative: ~80 / ~₹70k.

Assumptions (same as `18`): 25% trial→paid, 4% monthly churn, mix Starter 50% /
Growth 35% / Pro 12% / White-label 3%, annual plan adoption 30%.

## 9. Unit economics

```
ARPU (blended)          ₹900/month
Gross margin            ~85% (hosting + WhatsApp + gateway = ~₹135/customer)
CAC (field sales)       ₹1,200
CAC (organic/referral)  ₹200
Average lifetime        25 months (4% churn)
LTV                     ₹900 × 0.85 × 25 = ₹19,125
LTV:CAC                 ~16:1 (excellent; 3:1 se upar acha hai)
Payback period          ~1.5 months
```

## 10. Free ka istemal (strategically)

| Kya free | Kyun |
|---|---|
| 14-day full trial | Try karke hi samjhega |
| Data migration | Sabse bada friction, tum hatao |
| Onboarding call | Activation rate 2x kar deta hai |
| Pilot: pehli 5 libraries, 6 mahine free | Testimonials + case studies. Lifetime free nahi — convert or 50% off 3 months |
| Referral reward (1 month) | Sabse sasta acquisition channel |
| Data export hamesha | Trust — "lock-in nahi hai" bolne se log zyada aate hain |
