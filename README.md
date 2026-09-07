# StudyHub

Self-study library SaaS (repo folder: `libraryHub`).

- Product spec: [`studyhub-plan/`](studyhub-plan/README.md)
- Hostile audit: [`AUDIT/`](AUDIT/BACKLOG.md)

**Tonight's stack:** Vite owner UI + Fastify API + Postgres 16/18 (`studyhub-plan/05-Database-Schema.sql`). Nest+Next is not required to run the desk.

```bash
npm install
npm run dev
```

UI: `http://127.0.0.1:5173/`  
API: `http://127.0.0.1:8787/health`

Demo owner (seeded on first API boot):

- email: `owner@aarav.test`
- password: `demo1234`

Signup creates a real tenant, branch, 60 seats, and fee plans.

Postgres connection lives in `.env.local` (gitignored). Copy `.env.example`.

Audit SQL tests (scratch DB `studyhub_audit`):

```bash
npm run test:audit
```
