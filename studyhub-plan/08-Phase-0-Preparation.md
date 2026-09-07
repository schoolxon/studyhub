# 08 — PHASE 0: Preparation (Week 1-2)

**Goal:** Coding shuru karne se pehle sab kuch clear ho jaye. Yahan 2 hafte lagana
baad me 2 mahine bachaata hai.

---

## Week 1 — Research & Validation

### Day 1-2: Library list banao
- [ ] Apne sheher (Ambala/Chandigarh/nearby) ki 30 libraries ki list — Google Maps,
      Justdial, Instagram se
- [ ] Har ek ka naam, address, owner ka number, approx seats note karo
- [ ] Spreadsheet: Name | Contact | Seats | Visited | Interested | Notes

### Day 3-5: 10 owner interviews (physically jao, phone pe nahi)
- [ ] `01-Market-and-User-Research.md` wale 10 sawaal poocho
- [ ] **Unka register/Excel ki photo lo** — ye sabse valuable research hai
- [ ] Kaunse fields wo track karte hain, kaunse nahi — note karo
- [ ] Recording lo (permission leke)
- [ ] Har interview ke baad 10 min me summary likho

### Day 6: Analysis
- [ ] Top 5 pain points rank karo (kitne logon ne bola)
- [ ] Kitne log paise dene ko tayyar hain? Kitna?
- [ ] Kaunsa feature sabne maanga? Kaunsa kisi ne nahi?
- [ ] **Decision gate:** 6/10 log ₹500+ dene ko tayyar hain? Haan → aage badho.
      Nahi → pricing ya positioning badlo, ya doosra niche dekho.

### Day 7: Competitor deep-dive
- [ ] 3-4 existing library software ka trial lo
- [ ] Screenshots collect karo, kya acha hai kya kharaab
- [ ] Unka pricing note karo
- [ ] Play Store reviews padho — 1-star reviews me tumhara feature list chhupa hai
- [ ] Ek "kya nahi banana" list banao

---

## Week 2 — Design & Setup

### Day 8-9: Spec freeze
- [ ] `02-Complete-Feature-Specification.md` ko apni research ke hisaab se edit karo
- [ ] **MVP scope lock karo** — jo P0 me nahi hai wo Phase 1 me nahi banega, chahe
      kitna bhi acha idea lage
- [ ] Ek "Phase 2 ideas" file banao aur nayi ideas wahan daalte raho

### Day 10-11: Design
- [ ] Figma me 10 core screens design karo (ya shadcn se direct code karo)
  - Dashboard, Seat map, Student list, Student profile, Admission flow,
    Payment modal, Receipt, Due list, Attendance, Settings
- [ ] Color palette + typography fix
- [ ] Mobile aur desktop dono
- [ ] 2 owners ko design dikhao — "isme se fee kaise lenge?" poocho, dekho wo kahan
      click karte hain

### Day 12: Technical setup
- [ ] **Decision (frozen):** greenfield monorepo `apps/api` + `apps/web`. Is repo ka
      Vite+Firebase prototype **evolve mat karo** — freeze. UI reference copy OK,
      auth/schema nahi. (Ye existing code ki wajah se Phase 0 step hai, plan-flaw nahi.)
- [ ] GitHub repo (monorepo: `apps/api`, `apps/web`, `packages/shared`)
- [ ] Domain, Cloudflare, R2 (access key + `--endpoint-url`), Sentry, PostHog
- [ ] Offline GPG key for `backup@studyhub.in` (or documented recipient) before first dump
- [ ] Docker Compose: Postgres 16 + Redis 7 (API/web later)
- [ ] RLS: `studyhub_app` role ≠ table owner; FORCE RLS in first migration

### Day 13: Third-party accounts (ye lambe lagte hain, aaj hi shuru karo)
- [ ] **DLT registration** (SMS ke liye) — TRAI portal, 3-7 din lagte hain
- [ ] MSG91 / Textlocal account + template approval
- [ ] **WhatsApp Business API** — AiSensy/Interakt se shuru karo (1-2 din) ya
      Meta direct (2-3 hafte). Business verification ke liye GST/udyam certificate
      chahiye hoga
- [ ] Razorpay account + KYC (5-7 din)
- [ ] Google Play Console (₹2,000 one-time) — baad me app ke liye
- [ ] Business registration (proprietorship/LLP) agar nahi hai

### Day 14: Project plan
- [ ] `12-Sprint-Task-Checklist.md` ko Jira/Linear/Notion me import karo
- [ ] 2-week sprints define karo
- [ ] Definition of Done likho
- [ ] Git branching strategy: `main` (prod) ← `develop` ← `feature/*`
- [ ] CI pipeline: lint + typecheck + test on PR

---

## Phase 0 ka output (deliverables)

| # | Deliverable |
|---|---|
| 1 | 10 interview notes + recordings |
| 2 | Validated pain point list (ranked) |
| 3 | Pricing validation (kitne log kitna denge) |
| 4 | Locked MVP feature list |
| 5 | 10 designed screens |
| 6 | Repo + CI + dev environment running |
| 7 | DLT, WhatsApp, Razorpay applications submitted |
| 8 | 5 pilot libraries ne commit kiya (free me try karenge) |
| 9 | Sprint board with ~150 tickets |

---

## Phase 0 me ye galtiyan mat karna

❌ Seedha coding shuru kar dena — 3 mahine baad pata chalega ki galat cheez banayi
❌ Sirf phone pe research — owner ka register dekhna zaroori hai
❌ "Sab feature daal denge" — MVP me 40 feature = kabhi launch nahi hoga
❌ WhatsApp API ka approval last me shuru karna — launch ruk jayega
❌ Perfect design ka wait — 70% acha design se launch karo
