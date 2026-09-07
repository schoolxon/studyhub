# 18 — Financial Model

**This file is the canonical forecast.** `00`, `14`, `15` isko mirror karte hain.
Koi aur doc alag Month-12 number likhe to wo galat hai.

Sab numbers INR me, monthly, **ex-GST** (18% GST pass-through, margin nahi).
Calendar = day-1 se, solo founder who codes.

---

## 1. One-time setup costs

| Item | Cost |
|---|---|
| Domain (.in, 1 saal) | ₹800 |
| Business registration (proprietorship) | ₹2,000 |
| GST registration | ₹0-2,000 |
| Google Play Console | ₹2,000 |
| Apple Developer (agar iOS) | ₹8,500/year |
| Razorpay setup | ₹0 |
| WhatsApp BSP setup | ₹0-5,000 |
| Logo + brand | ₹3,000-10,000 |
| Legal (privacy policy, T&C) | ₹5,000 (ya template se free) |
| **Total** | **₹15,000 - ₹35,000** |

**Development cost:**
- Khud code karo: ₹0 (par ~5 mahine build + 1 mahina pilot — see `09`)
- 1 dev hire karo: ₹50,000-80,000/month × 4 = ₹2-3.2 lakh
- Agency outsource: ₹4-8 lakh (recommend nahi — SaaS me iteration chahiye)

---

## 2. Monthly running costs

### Fixed (customer count se independent)
| Item | Month 1-6 | Month 7-12 | Month 13-24 |
|---|---|---|---|
| VPS (app) | ₹3,500 | ₹4,000 | ₹8,000 |
| VPS (database) | — | ₹3,500 | ₹8,000 |
| Backup storage | ₹200 | ₹500 | ₹1,200 |
| Domain/SSL | ₹100 | ₹100 | ₹100 |
| Cloudflare | ₹0 | ₹0 | ₹1,700 |
| Sentry | ₹0 | ₹0 | ₹2,200 |
| PostHog | ₹0 | ₹0 | ₹1,500 |
| Email service | ₹0 | ₹500 | ₹1,000 |
| Misc tools | ₹500 | ₹1,000 | ₹2,000 |
| **Fixed total** | **₹4,300** | **₹9,600** | **₹25,700** |

### Variable (per customer per month)
| Item | Cost |
|---|---|
| WhatsApp messages (~150/customer) | ₹30-60 |
| SMS/OTP (~50/customer) | ₹10-15 |
| Storage (photos, PDFs) | ₹3 |
| Compute share | ₹15 |
| Payment gateway (on SaaS fee, 2%) | ₹18 |
| **Total variable** | **~₹80-110** |

**Gross margin: ~₹900 revenue − ₹100 variable = ₹800 (~88%)**

---

## 3. Revenue projection (Year 1)

Assumptions:
- Trial→paid conversion: 25%
- Monthly churn: 4%
- Plan mix: Starter 50%, Growth 35%, Pro 12%, White-label 3%
- Blended ARPU: climbs toward ₹900 as mix + annual plans land
- **Paid launch = Month 6** (Phase 0 + 14-week MVP + 4-week pilot)
- 5 pilot libraries are **not** paying until they convert after 6 free months
  (upside in M12–M14, not in this table)

| Month | New trials | New paid | Churned | Total paid | ARPU | MRR |
|---|---|---|---|---|---|---|
| 1–5 | Build + 5-library pilot | — | — | 0 | — | ₹0 |
| 6 | 30 | 8 | 0 | 8 | ₹600 | ₹4,800 |
| 7 | 40 | 12 | 0 | 20 | ₹650 | ₹13,000 |
| 8 | 50 | 16 | 1 | 35 | ₹700 | ₹24,500 |
| 9 | 60 | 18 | 1 | 52 | ₹750 | ₹39,000 |
| 10 | 75 | 22 | 2 | 72 | ₹780 | ₹56,160 |
| 11 | 90 | 28 | 3 | 97 | ₹800 | ₹77,600 |
| 12 | 110 | 34 | 4 | 127 | ₹830 | ₹1,05,410 |

**Year 1 exit (base): ~127 paying, ₹1.05 lakh MRR, ~₹12.6 lakh ARR run-rate**

- **Aggressive:** sales starts in pilot (M5 trials), M12 ~180 paying / ~₹1.6 lakh MRR
- **Conservative:** slow field sales, M12 ~80 paying / ~₹70k MRR

Do not use “300 customers / ₹3L MRR at month 12” anywhere. That was v1.0
headline, not this funnel.

Cumulative collections (sum of month-end MRR, same method as v1.0): ~₹3.20 lakh.

---

## 4. P&L (Year 1, cumulative)

Founder khud code + early sales karta hai (salary nahi). Hires follow `19`:
sales exec from Month 7, support from Month 8. No second developer in year-1 base.

| | Amount |
|---|---|
| **Revenue** (sum of month-end MRR) | ₹3,20,000 |
| Variable costs | ₹40,000 |
| **Gross profit** | ₹2,80,000 |
| Infrastructure (fixed) | ₹85,000 |
| Salaries (sales M7–12, support M8–12) | ₹2,50,000 |
| Sales/travel | ₹80,000 |
| Marketing | ₹50,000 |
| One-time setup | ₹30,000 |
| **Total expenses** | ₹5,35,000 |
| **Net (Year 1)** | **−₹2,55,000** |

Agar sales hire bhi founder delay kare to Year 1 approximately −₹1 lakh ke
aas-paas. Buffer `19` wala 6-month runway rule: personal ~₹2–3 lakh still required.

---

## 5. Break-even analysis

```
Fixed monthly costs (Month 7-12, no salary):    ₹9,600
Contribution per customer:                       ₹800

Break-even (bootstrapped, no salaries) = 9,600 / 800 = 12 customers
```

```
With 1 developer (₹60,000/month):
Fixed = 9,600 + 60,000 = ₹69,600
Break-even = 69,600 / 800 = 87 customers
```

```
With full team (dev + support + founder salary ₹1,50,000):
Fixed = ₹1,60,000
Break-even = 200 customers
```

**Milestone:** 12 customers pe infra cover, 90 pe ek developer afford, 200 pe team.

---

## 6. Year 2–3 projection (directional)

v1.1 Year-1 exit is **127 paying / ₹1.05L MRR**, not 218. Re-forecast after the
first paid quarter. These rows assume healthy retention + Phase-2 ARPU mix,
not a new bottoms-up funnel.

| | Year 2 end | Year 3 end |
|---|---|---|
| Paying customers | 500–700 | 1,200–1,600 |
| ARPU | ₹1,100 | ₹1,400 |
| MRR | ₹5–8 lakh | ₹17–22 lakh |
| Team size | 6–8 | 14–18 |
| Net margin | thin / ~10% | ~20–25% |

ARPU growth kahan se: plan upgrades, add-ons (branded app, credits), marketplace
featured listings, chain clients.

---

## 7. Cash flow ke liye 5 rules

1. **Annual plans push karo** — ₹9,990 upfront vs ₹999/month. Cash flow transform ho
   jaata hai aur churn 60% girta hai.
2. **Setup fee lo bade clients se** — white-label ₹15,000 upfront
3. **Payment gateway settlement T+2** — Razorpay se cash 2 din me aata hai, plan karo
4. **Kharch tab badhao jab MRR badhe** — MRR ka 60% se zyada salary me mat daalo
5. **6 mahine ka runway hamesha rakho** — jo bachta hai usme se buffer alag karo

---

## 8. Funding: chahiye ya nahi?

**Bootstrap kar sakte ho agar:**
- Founder khud code kar sakta hai
- ₹2-3 lakh ka personal buffer hai (6 mahine ka kharch)
- Dhaire growth se problem nahi

**Funding lo agar:**
- Multi-city me tezi se expand karna hai (sales team chahiye)
- Marketplace pehle banana hai (network effect me speed matter karti hai)
- Competitor aggressive hai

**Realistic ask:** ₹40-75 lakh seed at ₹4-8 crore valuation, jab
100+ paying customers aur ₹1 lakh MRR ho jaye. Us se pehle traction dikhao,
deck nahi.

Bootstrap recommended hai — ye business capital-efficient hai aur customers se
paisa aa sakta hai din 1 se.

---

## 9. Sensitivity: churn ka asar (ye sabse important number hai)

100 customers, ₹900 ARPU se shuru karke 12 mahine baad:

| Monthly churn | Customers after 12 mo | MRR |
|---|---|---|
| 2% | 78 (of original) + new | Healthy |
| 4% | 61 | Acceptable |
| 7% | 42 | Danger |
| 10% | 28 | Business dead |

**Sabak:** 1% churn kam karna, 10 naye customers laane se zyada valuable hai.
Retention pe utna hi kharch karo jitna acquisition pe.
