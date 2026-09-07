# StudyHub

Self-study library SaaS (repo folder: `libraryHub`).

- Product spec: [`studyhub-plan/`](studyhub-plan/README.md)
- Hostile audit: [`AUDIT/`](AUDIT/BACKLOG.md)

Greenfield target is NestJS + Next.js + Postgres (`studyhub-plan/04-Tech-Architecture.md`).
The Vite app in `src/` is a **clickable owner shell** with in-memory demo data. It is not the production stack.

```bash
npm install
npm run dev
```

Open:

- `/` landing
- `/login` (any email/password)
- `/signup` → OTP `123456`
- `/app` dashboard, students, seats, attendance, invoices, settings

Audit SQL tests (scratch DB `studyhub_audit`, libpq env vars):

```bash
npm run test:audit
```
