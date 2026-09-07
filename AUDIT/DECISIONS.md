# StudyHub hostile audit — decisions

Judgement calls where the spec was silent, contradictory, or the repo disagrees with the plan. Do not treat these as implemented code.

---

## D-01 — Canonical spec folder is `studyhub-plan/`

**Ambiguity:** README v1.1 still says “Canonical copy: `plan_doc/`”. On disk the folder is `studyhub-plan/` (renamed by the human). The audit prompt also names `/studyhub-plan/`.

**Decision:** `studyhub-plan/` is SoT. `plan_doc/` is a stale name. Finding **P2-38**.

**Docs to edit:** `studyhub-plan/README.md` (and any leftover `plan_doc` pointers). Not done in iteration 0 (evidence-only).

---

## D-02 — Forecast / commercial numbers

**Already frozen in spec v1.1** (verified by grep 2026-09-07):

- SSOT: `18-Financial-Model.md`
- Month 12 base: 127 paying / ₹1.05L MRR; paid launch Month 6
- GST extra 18% on list prices
- Pilot: 5 libraries × 6 months free (not lifetime)
- White-label: ₹4,999/month + ₹15,000 setup
- Solo MVP: 16–20 weeks build + 4-week pilot

Seed P2-23…P2-28, P2-26 are **VERIFIED in documents**. They are not VERIFIED in product code (there is none).

---

## D-03 — Schema vs Prisma direction

**Decision:** `05-Database-Schema.sql` wins. Prisma (if/when generated) must match it. GiST exclusion stays raw SQL. Do not reverse-engineer schema from an ORM.

---

## D-04 — Stack: migrate vs rewrite (OPEN — human)

See `OPEN-QUESTIONS.md` Q-01. **This session will not silently pick.**

Working analysis (effort, not a choice):

| Path | What you keep | What you throw | Honest effort |
|------|---------------|----------------|---------------|
| **A. Rewrite (plan `04`)** | Domain knowledge, `05` SQL, design-system CSS/tokens just ported from waste_management | Vite Firebase SPA as product (keep as throwaway prototype) | Solo **16–20 weeks** to pilot-ready Nest+Next as already in `09`/`19`. Greenfield RLS, OTP, Prisma+raw SQL migrations. |
| **B. Evolve current Vite app** | Current React Router shell + DS | None of the plan’s RLS/OTP/Nest | Faster screens, **cannot** deliver FORCE RLS, GiST on Prisma-less Firebase, or server-side permission checks. Firebase Auth has no Postgres GUC. Firestore security rules ≠ tenant RLS. |

**Firebase Auth gives you:** hosted OTP/password users, session cookies, some MFA later.

**Firebase Auth cannot give you:** `SET LOCAL app.tenant_id`, FORCE RLS, GiST exclusion, integer-paise invoices with DB constraints, webhook idempotency table, or an audit trail the library owner’s accountant can trust independently of Google.

**Meanwhile:** fix stack-independent holes (schema SQL, doc drift, secrets in git). Do **not** invent a Nest app only so Playwright has a target.

---

## D-05 — Conservative behaviour while Qs are open

| Topic | Conservative pick (labeled, not coded yet) |
|-------|--------------------------------------------|
| Refresh tokens | Hashed rows in `refresh_tokens` (revocable, per-device) + short-lived access JWT. Redis optional for access-token blacklist. Not implemented. |
| Pause hold-charge | **Off** in MVP. Seat stays allocated; no extra daily fee until a column + invoice item type exist. |
| Student requests | Phase 2 student-app table; Phase 1 staff records pause/leave/seat-change as first-class membership operations. |
| `tenants` RLS | Policy: row visible only if `id = current_setting('app.tenant_id')::uuid`; platform_admins use a **separate** DB role / bypass, not NULL tenant_id on `users`. |

---

## D-06 — Tests cannot be greenwashed

There is no API. Playwright tenant-isolation suite **does not exist**. Marking P0 FIXED without a failing-then-passing test against an **applied** database is forbidden. Iteration 1+ must create a scratch DB (`studyhub_audit_*`) — never drop a database this session did not create.
