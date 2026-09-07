# StudyHub hostile audit — open questions (human only)

Do not guess. Do not block unrelated work. Conservative workarounds live in `DECISIONS.md` D-05.

---

## Q-01 — Migrate the Vite+Firebase app, or rewrite Nest+Next+Postgres?

**Why only you can decide:** it sets every P0 timeline. RLS, GiST, OTP, and money integrity are not portable onto Firestore.

**What is true today:**

- Disk: Vite + React 19 + Tailwind 4 + design-system CSS + visual login/dashboard. **No Firebase client in the working tree** (deleted; still in git HEAD).
- Plan (`00`, `04`, `08`): greenfield NestJS + Next.js + Prisma + Postgres + Redis + OTP.
- Package.json still lists `firebase`, `next`, `@mui/*` as leftover deps.

**Ask:** confirm rewrite (plan) vs keep Vite as the web and only add a Nest API. Until answered, no Nest scaffolding and no Firebase restore.

---

## Q-02 — Refresh tokens: Postgres table, Redis, or both?

`06` exposes `POST /auth/refresh`. `04` only lists a Redis JWT blacklist. Reuse detection (stolen token) needs a stored family/jti.

**Ask:** table `refresh_tokens` (hashed, `user_id`, `expires_at`, `revoked_at`, `user_agent`) as source of truth, Redis optional?

---

## Q-03 — Pause hold-charge in MVP?

`07` says seat hold during pause and “chaho to hold charge”. No column, no invoice item type.

**Ask:** MVP = hold seat, **₹0/day**, or bill `hold_charge_paise_per_day` from day one?

---

## Q-04 — `POST /student/requests` in Phase 1?

Student app is Phase 2 (`10`). Endpoint is already in `06`. Table missing from `05`.

**Ask:** drop the endpoint from Phase 1 API spec, or add `student_requests` now for staff-on-behalf too?

---

## Q-05 — Rotate Firebase web API key?

`src/firebase/firebase.js` in git HEAD contains a live-looking `apiKey` for `library-seat-booking-sys-7f39b`. Deleting the working copy does **not** invalidate the key.

**Ask:** restrict HTTP referrers / rotate the key in Google Cloud. Confirm when done so **P0-37** can move to VERIFIED.
