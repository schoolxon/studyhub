# StudyHub hostile audit — open questions (human only)

---

## Q-01 — Migrate the Vite+Firebase app, or rewrite Nest+Next+Postgres?

**DECIDED 2026-09-08 (user: agent decides, ship tonight).** Path B+: keep the Vite owner UI, add Fastify + Postgres (`05` raw SQL, `studyhub_app` + SET LOCAL). Do **not** start Nest+Next tonight — that would leave two half-apps. Nest remains a later option if we outgrow Fastify.

---

## Q-02 — Refresh tokens — DECIDED (conservative)

**Postgres `refresh_tokens` (hashed, revocable) is SoT.** Redis access-token blacklist optional. See `05` / `0003`.

---

## Q-03 — Pause hold-charge — DECIDED (conservative)

**MVP ₹0/day** (`hold_charge_paise` default 0). Seat still held. Non-zero later.

---

## Q-04 — student_requests — DECIDED

**Table exists now** for staff-on-behalf in Phase 1; student app still Phase 2.

---

## Q-05 — Rotate Firebase web API key?

**Still open. You must do this.** The key was deleted from HEAD in `447b89f` (`src/firebase/firebase.js` gone). Deleting the working tree is not a rotation — the key remains in git history. P0-37 is WONTFIX for the agent.
