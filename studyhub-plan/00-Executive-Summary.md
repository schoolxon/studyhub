# 00 — Executive Summary

> **Numbers source of truth:** `18-Financial-Model.md` (base case).
> Is page pe koi alag forecast nahi — sirf uska nichod.

## Product ek line me
**StudyHub** ek multi-tenant SaaS hai jo self-study library owners ko seats, students,
fees, attendance aur WhatsApp reminders ek jagah manage karne deta hai — Excel aur
register ki jagah.

Repo ka naam `libraryHub` hai; product ka naam **StudyHub**. Firebase wala current
frontend ek prototype hai — naya system `04-Tech-Architecture.md` ke hisaab se
greenfield banega (Vite+Firebase evolve nahi hoga).

## Problem
Aaj India me 1 lakh+ paid study libraries hain. 90% owners register/Excel/WhatsApp pe
chal rahe hain. Result:
- Har mahine 8-15% fees collection leak (kisko due hai yaad hi nahi rehta)
- Seat double-book ho jaati hai, students ladte hain
- Owner ko actual profit ka andaza nahi
- Staff cash me hera-pheri kar leta hai, koi audit trail nahi
- Har student ko manually WhatsApp karna padta hai

## Solution
Ek simple, Hindi-supported, mobile-first web app (student app Phase 2):
seat map → student admission → membership → auto invoice → auto WhatsApp reminder →
attendance → owner dashboard with real profit.

## Kyun jeetenge
1. **Seat sharing across shifts** — India ka core use case, foreign tools me hai hi nahi
2. **Cash-first design** — 70% payment cash me hoti hai, 3 tap me entry
3. **Hindi UI** — chhote sheher ka staff angrezi nahi padh pata
4. **WhatsApp automation** — owner ka #1 demanded feature
5. **Marketplace (Phase 3)** — students ko library dhoondhne ka platform → owners lock in

## Business model
Saari list prices **GST extra** (18% SaaS). Owner ko bolo “₹499 + GST”.

| Plan | Price/month (ex-GST) | Students |
|---|---|---|
| Trial | Free, 14 din | 30 |
| Starter | ₹499 (₹589 incl. GST) | 100 |
| Growth | ₹999 | 300 |
| Pro | ₹1,999 | Unlimited |
| White-label | ₹4,999 + ₹15k setup | Unlimited |

Annual me 2 mahine free (10× monthly). Add-ons: WhatsApp credits, custom domain,
branded app.

## Timeline (solo founder who codes)

| Phase | When | Outcome |
|---|---|---|
| Phase 0 | Week 1–2 | 10 owner interviews, spec freeze, design |
| Phase 1 | Week 3–18 (16 weeks) | Pilot-ready: seats, admission, cash, dues, WhatsApp, attendance |
| Pilot | Week 19–22 | **5 libraries**, **6 months free** (lifetime nahi) |
| Paid launch | Month 6 | First converting customers |
| Phase 2 | Month 7–10 | Student app, online payment, CRM |
| Phase 3 | Month 11–18 | Marketplace, white-label, AI |

2 full-stack devs hon to Phase 1 ~10 weeks ho sakta hai — default plan solo hai.

## Money (base case — `18` se)

- **Build cost (MVP):** ₹0 agar khud code karo, warna ₹3–6 lakh outsource
- **Running cost start me:** ~₹5,000–8,000/month (VPS + WhatsApp/SMS + tools)
- **Break-even (label ke saath):**
  - Infra only (no salary): **~12 paying**
  - + 1 developer: **~87 paying**
  - Full team + founder salary: **~200 paying**
- **Month 12 target (base):** 127 paying, ₹1.05 lakh MRR, ~₹12.6 lakh ARR run-rate
- **Month 12 aggressive:** ~180 paying, ~₹1.6 lakh MRR (sales pilot ke dauran shuru)
- **Month 18 base:** see `18` Year-2 ramp — do not quote 300 paying at month 12

## Team
Start: founder = full-stack + sales. Pehla hire **sales/onboarding** (Month 6–7),
developer nahi — product founder bana raha hai. Support Month 8. Extra full-stack
tab jab MRR ~₹70k+ ho (Month 9–10). Detail: `19-Team-and-Hiring.md`.

## Success metrics
| Metric | Target |
|---|---|
| Daily active owner | >70% |
| Monthly churn | <4% |
| Trial → paid conversion | >25% |
| Support tickets | <0.5 per customer/month |
| Time to first admission (onboarding) | <15 minutes |

## Sabse bada risk
Product build kar liya lekin **owner use nahi karta** kyunki purana register aasan lagta
hai. Iska ilaaj: free data migration + on-site onboarding + itna simple UI ki 55 saal ka
owner bina training ke chala le.

## Pilot rule
Pehli **5** libraries, **6 mahine free**, data tum daalo, hafte me 15 min feedback.
Lifetime free nahi — 6 mahine ke baad paid me convert, ya 50% off next 3 months.
