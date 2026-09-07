# StudyHub hostile audit — open questions (human only)

---

## Q-01 — Migrate the Vite+Firebase app, or rewrite Nest+Next+Postgres?

**Still open.** Sets every remaining API P0 (Playwright tenant suite, SET LOCAL interceptor).

Until answered: no Nest scaffold, no Firebase restore.

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

**Still open. You must do this.** Key is in git HEAD `src/firebase/firebase.js`. Deleting the working tree is not a rotation. P0-37 is WONTFIX for the agent.
