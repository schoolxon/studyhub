# StudyHub — Complete SaaS Implementation Plan

Self-study library / reading room management ke liye ek multi-tenant SaaS product ka
**end-to-end blueprint**.

Ye plan Indian market (Ambala, Chandigarh, Kota, Patna, Delhi, Hisar type sheher) ke
self-study libraries ko target karta hai jahan students monthly seat lekar padhte hain.

**Canonical copy:** yahi folder (`studyhub-plan/`). Product name **StudyHub**;
git repo `libraryHub`. Current Vite+Firebase code prototype hai; build plan
greenfield NestJS + Next.js + Postgres hai (`04`).

---

## Documents ka index — isi order me padho

| # | File | Kya hai isme |
|---|------|--------------|
| 00 | `00-Executive-Summary.md` | Poore plan ka 2-page nichod. Pehle ye padho. |
| 01 | `01-Market-and-User-Research.md` | Customer kaun, problem kya, competitor, validation script |
| 02 | `02-Complete-Feature-Specification.md` | **Har feature ka detail spec** — module by module |
| 03 | `03-User-Flows-and-Screens.md` | Screen list, navigation, wireframe description |
| 04 | `04-Tech-Architecture.md` | Stack, multi-tenancy, RLS/Prisma rules, folder structure |
| 05 | `05-Database-Schema.sql` | **Ready-to-run PostgreSQL schema** |
| 06 | `06-API-Specification.md` | Saare REST endpoints, request/response format |
| 07 | `07-Business-Logic-Rules.md` | Proration, seat sharing, pause, grace period ka exact algorithm |
| 08 | `08-Phase-0-Preparation.md` | Coding se pehle 2 hafte kya karna hai |
| 09 | `09-Phase-1-MVP.md` | Week-by-week MVP (Week 3–16) + launch hardening |
| 10 | `10-Phase-2-Growth.md` | Month 7–10: student app, payments, CRM |
| 11 | `11-Phase-3-Scale.md` | Month 11–18: marketplace, white-label, AI |
| 12 | `12-Sprint-Task-Checklist.md` | **Ticket-level task list** — copy-paste into Jira/Notion |
| 13 | `13-Notification-Templates.md` | WhatsApp/SMS ke ready templates (Hindi + English) |
| 14 | `14-Pricing-and-SaaS-Billing.md` | Plans, limits, trial, dunning, GST |
| 15 | `15-GTM-Sales-Playbook.md` | Pehle 100 customers kaise laoge — script ke saath |
| 16 | `16-Infra-DevOps-Security.md` | Deployment, backup, monitoring, security checklist |
| 17 | `17-Testing-QA-Checklist.md` | Launch se pehle ka QA plan |
| 18 | `18-Financial-Model.md` | **Canonical** cost, revenue, unit economics, break-even |
| 19 | `19-Team-and-Hiring.md` | Kaun kaun chahiye, kab hire karo, kitna kharch |
| 20 | `20-Risks-and-Edge-Cases.md` | Risks, India edge cases, decision log |
| 21 | `21-First-30-Days-Action-Plan.md` | **Kal se kya karna hai** — day by day |

---

## Kaise use karein

1. **Founder/business person ho?** → 00, 01, 14, 15, 18 padho
2. **Developer ho?** → 02, 04, 05, 06, 07, 12, 16 padho
3. **Designer ho?** → 02, 03 padho
4. **Aaj se kaam shuru karna hai?** → seedha `21-First-30-Days-Action-Plan.md` kholo

**Forecast clash ho to:** hamesha `18` jeetega. `00` / `14` / `15` usi table ko
mirror karte hain.

---

## Golden rule

> Pehle **5** libraries me product **6 mahine** free chalao, unke saamne baith kar
> dekho ki wo kaise use karte hain. Jo feature wo use nahi karte, wo delete kar do.
> Product tab banega jab ek library owner bina tumhe call kiye 30 din tak roz login
> karta rahe.

---

## Version

**1.1** (2026-09-07) — Author-confirmed freeze: FORCE RLS + `set_config` in
`$transaction` + `platform_admins`; missing tables; `18` SSOT (M12 = 127 / ₹1.05L);
solo MVP 16–20 weeks, Sprint 5 split; greenfield vs Firebase; date math; attendance
sessions; occupancy view. GST extra. Pilot 5 × 6 months. White-label ₹4,999 + ₹15k.

**1.0** — original pack.
