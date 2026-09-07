# 04 — Technical Architecture

## 1. Scale assumption (over-engineering se bacho)

Realistic year-1 load:
- 300 tenants, ~50,000 students total
- Peak ~50 req/s (admission time pe spike)
- DB size year-1 me < 20 GB (photos alag object storage me)
- Background jobs: ~20,000 notification/day

**Iske liye Kubernetes, Kafka, microservices ki ZARURAT NAHI hai.**
Ek modular monolith + Postgres + Redis + ek VPS 3 saal tak chalega.
Jab measured bottleneck aaye tabhi scale karo.

---

## 2. Recommended stack

| Layer | Choice | Kyun |
|---|---|---|
| Web frontend | Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui | Fast dev, SEO for public/marketplace pages |
| State/data | TanStack Query + Zustand | Server state + minimal client state |
| Mobile app | React Native (Expo) | Ek codebase, OTA updates, Android priority |
| Backend | NestJS (Node + TypeScript) — modular monolith | Type sharing with frontend, structure built-in |
| ORM | Prisma (ya TypeORM) | Migrations, type-safe queries |
| Database | PostgreSQL 16 | Relational data, strong reporting, row-level security |
| Cache + queue | Redis 7 + BullMQ | Sessions, rate limit, reminder jobs |
| Object storage | Cloudflare R2 (S3 API) | Egress free — photos ke liye sasta |
| Auth | Custom JWT + OTP (MSG91) | Simple, Indian users ke liye OTP hi chahiye |
| Payments | Razorpay (subscriptions + UPI AutoPay) | Best Indian docs, mandate support |
| WhatsApp | Meta Cloud API direct, ya AiSensy/Interakt wrapper | Direct sasta, wrapper fast to launch |
| SMS | MSG91 (DLT registered) | Reliable, OTP + transactional |
| PDF | Puppeteer (HTML→PDF) ya PDFKit | Receipts, reports |
| Email | Resend / AWS SES | Low priority |
| Error tracking | Sentry | Free tier kaafi |
| Uptime | BetterStack / UptimeRobot | Free |
| Analytics | PostHog (self-host ya cloud free tier) | Product analytics, funnels |
| CI/CD | GitHub Actions | Free for private repos |
| Hosting | Hetzner CPX41 (16GB) year-1 — see `16`. 4GB box mat lo. | ~₹3,500/month |
| CDN + WAF | Cloudflare (free plan) | DDoS, caching, SSL |

**Alternative agar team PHP jaanti hai:** Laravel 11 + Filament (admin panel) + Livewire.
Ye MVP 30-40% fast bana dega. Stack se zyada important hai speed of shipping.

---

## 3. System diagram

```
                         Internet
                            │
                   Cloudflare (DNS, SSL, WAF, cache)
                            │  (origin locked to CF IPs)
                            ▼
                   ┌────────────────────┐
                   │  Nginx / Caddy      │  TLS, reverse proxy, rate limit
                   └────────┬───────────┘
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
      Next.js Web     NestJS API      Worker (BullMQ)
      (SSR/static)    (REST + JWT)    (reminders, PDF, webhooks)
             │              │              │
             └──────────────┼──────────────┘
                            ▼
        ┌───────────────┬───────────────┬─────────────────┐
        ▼               ▼               ▼                 ▼
   PostgreSQL 16     Redis 7      Cloudflare R2     External APIs
   (primary +      (cache,       (photos, PDFs,    (WhatsApp, SMS,
    daily backup    queue,        backups)          Razorpay)
    + PITR)         sessions)

   Observability: Sentry (errors) + Prometheus/node-exporter + Uptime monitor
```

---

## 4. Multi-tenancy design

**Approach: Shared database, shared schema, `tenant_id` column + Row Level Security.**

Kyun ye choose kiya:
- Sasta (ek DB), simple migrations, cross-tenant analytics aasan
- 1,000+ tenants tak comfortably scale karega
- Trade-off: ek bug se cross-tenant leak ho sakta hai → isliye **defence in depth**

### Isolation ke 3 layer (teeno lagao, sirf ek pe bharosa mat karo)

**Layer 1 — Postgres RLS + FORCE + non-owner role**

Table owner RLS **bypass** karta hai jab tak `FORCE ROW LEVEL SECURITY` na ho.
`ENABLE` kaafi nahi hai.

```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE students FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON students
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

App role table owner **nahi** hota. `tenants` (SaaS directory) bhi FORCE RLS:
`id = current_setting('app.tenant_id')::uuid`. Platform admin **alag role**
(BYPASSRLS / superuser) se tenant list karta hai, `studyhub_app` se nahi.

```sql
CREATE ROLE studyhub_app LOGIN PASSWORD '<secret>';
-- no BYPASSRLS, no SUPERUSER
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studyhub_app;
```

GiST `EXCLUDE` constraints Prisma `schema.prisma` me express nahi hote — raw SQL
migration source of truth hai (`05-Database-Schema.sql`). Prisma introspect/db
push se ye constraint drop mat karo.

**Layer 1b — SET LOCAL sirf transaction ke andar (Prisma pool leak)**

`SET LOCAL` transaction ke bahar **no-op** hai (warning). Log ye galti karega:
session-level `SET app.tenant_id` pooled connection pe — agle request ko purana
tenant mil jayega. **Ye literal cross-tenant leak hai.**

Har HTTP request (aur har job) ek interactive transaction:

```ts
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  await tx.$executeRaw`SELECT set_config('app.is_super_admin', 'false', true)`;
  // saari queries isi tx pe — tx.student.findMany() etc.
});
```

`set_config(..., true)` = `SET LOCAL`. Prisma interceptor jo transaction ke
**bahar** SET kare, wo bug hai — CI me isolation suite isko pakde.

PgBouncer: transaction pooling OK hai kyunki LOCAL txn se bound hai. Session
pooling bhi theek. Statement pooling + SET LOCAL = tootega; use mat karna.

**Layer 1c — Super admin `users.tenant_id = NULL` mat rakho**

Policy `tenant_id = app.tenant_id` NULL rows ko hamesha hide karti hai.
Login se pehle tenant set nahi hota — super admin **din 1 pe login nahi karega**.

Fix: alag table `platform_admins` (RLS loop me nahi). Tenant `users.tenant_id`
**NOT NULL**. Impersonation: platform admin JWT ke baad **usi request ki**
`$transaction` me `set_config('app.tenant_id', target, true)` — RLS bypass nahi.

**Layer 2 — ORM middleware**
Prisma extension / NestJS interceptor jo har query me `where: { tenantId }`
inject kare — defence in depth, RLS ka substitute nahi.

**Layer 3 — Automated test**
Har resource type: Tenant-A token → Tenant-B id = **404** (403 nahi).
Ek test: transaction ke bahar raw `SELECT * FROM students` RLS empty/deny.
CI me chale, merge block.

**Enterprise clients (Phase 3):** unko separate database do — ye premium pricing
justify karta hai aur compliance ka jawab ban jaata hai.

### Repo decision (Phase 0, ye plan ka flaw nahi)

Is git repo me aaj Vite + Firebase prototype pada hai. Production build
**greenfield** hai (`apps/api` Nest, `apps/web` Next) — Firebase ko evolve
mat karo. Prototype freeze; UI ideas copy ho sakte hain, schema/auth nahi.

---

## 5. Backend folder structure (NestJS)

```
src/
├── common/
│   ├── guards/          (JwtAuthGuard, RolesGuard, TenantGuard)
│   ├── interceptors/    (TenantContext, ActivityLog, ResponseTransform)
│   ├── decorators/      (@CurrentUser, @CurrentTenant, @Roles)
│   ├── filters/         (AllExceptionsFilter)
│   └── utils/           (date-utils, money-utils, proration)
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── branches/
│   ├── shifts/
│   ├── seats/
│   ├── students/
│   ├── memberships/
│   ├── fee-plans/
│   ├── invoices/
│   ├── payments/
│   ├── attendance/
│   ├── expenses/
│   ├── notifications/
│   ├── reports/
│   ├── leads/
│   ├── lockers/
│   ├── complaints/
│   ├── subscriptions/   (SaaS billing — apna)
│   └── admin/           (super admin panel)
├── jobs/
│   ├── reminder.processor.ts
│   ├── expiry.processor.ts
│   ├── invoice.processor.ts
│   └── report.processor.ts
├── integrations/
│   ├── whatsapp/
│   ├── sms/
│   ├── razorpay/
│   └── storage/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── main.ts
```

Har module me: `controller.ts`, `service.ts`, `dto/`, `entities/`, `*.spec.ts`

---

## 6. Frontend folder structure (Next.js)

```
app/
├── (auth)/login, signup, verify-otp
├── (app)/
│   ├── dashboard/
│   ├── seats/
│   ├── students/[id]/
│   ├── admission/
│   ├── fees/
│   ├── attendance/
│   ├── reports/
│   ├── expenses/
│   └── settings/
├── (public)/
│   ├── [librarySlug]/       ← public library page
│   └── search/              ← marketplace
└── api/                     ← BFF routes if needed

components/
├── ui/                      ← shadcn primitives
├── seat-map/
├── student-card/
├── payment-modal/
└── charts/

lib/
├── api-client.ts
├── auth.ts
├── i18n/  (en.json, hi.json)
└── utils/
```

---

## 7. Background jobs (BullMQ)

| Job | Schedule | Kaam |
|---|---|---|
| `expiry-check` | Roz 6:00 AM | Queue reminders. **Status mat paint karo** — `expiring`/`expired` dates se derive (`07`). |
| `fee-reminder` | Roz 10:00 AM | 5-din-pehle / due-day / overdue reminders queue karo |
| `daily-summary` | Roz 9:00 PM | Owner ko WhatsApp summary |
| `absent-alert` | Roz 8:00 PM | 3+ din absent students → owner |
| `auto-checkout` | Roz 11:59 PM | Jo check-out bhool gaye, shift end pe mark karo |
| `invoice-generate` | Roz 12:05 AM | Recurring/auto-renew invoices |
| `subscription-billing` | Roz 1:00 AM | SaaS plan renewals, trial expiry, dunning |
| `backup-verify` | Roz 3:00 AM | Backup file exist + size check |
| `whatsapp-send` | On demand | Rate-limited sender queue |
| `pdf-generate` | On demand | Receipts, reports |

**Rules:**
- Har job idempotent ho (dobara chalne se duplicate message na jaye)
- `notification_log` table me `(student_id, type, date)` unique index
- Retry with exponential backoff, 3 attempts, phir dead-letter queue + alert
- Job failures Sentry me jaayein

---

## 8. Caching strategy

| Data | TTL | Kahan |
|---|---|---|
| Session/JWT blacklist | token life | Redis |
| Dashboard KPIs | 60 sec | Redis, tenant-scoped key |
| Seat map | 30 sec, invalidate on write | Redis |
| Fee plans, shifts, settings | 10 min | Redis |
| Reports | 5 min | Redis |
| Rate limit counters | 1 min window | Redis |

Cache key pattern: `t:{tenant_id}:dashboard:{date}` — tenant prefix hamesha, warna leak.

---

## 9. Key technical decisions & trade-offs

| Decision | Chuna | Alternative | Kyun |
|---|---|---|---|
| Monolith vs microservices | **Modular monolith** | Microservices | 2-person team, 300 tenants — microservices sirf pain degi |
| Multi-tenancy | **Shared DB + RLS** | DB per tenant | Cost aur ops burden 10x kam |
| SSR vs SPA | **Next.js SSR** | Pure SPA | Public/marketplace pages ko SEO chahiye |
| Postgres vs MySQL | **Postgres** | MySQL | RLS, JSONB, better window functions for reports |
| Self-host vs managed DB | **Self-host year 1, managed year 2** | Managed | Cost — par backup discipline honi chahiye |
| WhatsApp direct vs BSP | **BSP (AiSensy) pehle** | Meta direct | Direct integration me template approval aur setup me 2-3 hafte |
| Money storage | **Integer paise (bigint)** | Float/Decimal | Float me rounding bug aayega, paise me sab exact |
| Timezone | **DB me UTC, display me IST** | Local time | Standard practice, DST issue nahi par consistent |
| Soft delete | **Haan, `deleted_at` + partial UNIQUE** | Hard delete | Full UNIQUE reuse block karta hai |
| Super admin | **`platform_admins` table** | `users.tenant_id` NULL | NULL rows RLS se ghayab; login tootega |
| Tenant SET | **`set_config(..., true)` inside `$transaction`** | Connection-start SET LOCAL | LOCAL txn ke bahar no-op; session SET pool leak |

---

## 10. Non-negotiable production rules

- ❌ Kabhi `image: latest` — version pin karo
- ❌ Secrets Git me nahi — `.env` gitignored, production me env vars / Doppler / Vault
- ✅ Har service: health endpoint `/health`, structured JSON logs, request_id har log line me
- ✅ Postgres: daily automated backup + **restore test har mahine** (untested backup = no backup)
- ✅ Har change: PR review, migration rollback plan
- ✅ TLS everywhere, DB port kabhi public nahi (`0.0.0.0/0` ban)
- ✅ Rate limiting: login 5/min per IP, OTP 3/hour per number, API 100/min per tenant
- ✅ Har destructive action activity_log me
- ✅ RLS: `ENABLE` + `FORCE`; app role non-owner; tenant `set_config` only inside `$transaction`
- ✅ GiST exclusion + counters: raw SQL migrations, Prisma schema se generate mat karo
