# 16 — Infrastructure, DevOps & Security

## 1. Environments

| Env | Purpose | Infra |
|---|---|---|
| Local | Dev | Docker Compose |
| Staging | QA, demo | 1 small VPS (2GB) |
| Production | Live | 1 VPS (8GB) year-1, scale later |

**Year-1 production spec:**
Hetzner CPX41 (8 vCPU, 16GB RAM, 240GB NVMe) — ~₹3,500/month.
**1 API process + 1 worker** year-1. Compose `deploy.replicas` Swarm ke bina
**ignore** hota hai, aur do container `127.0.0.1:3001` bind nahi kar sakte.
Doosri API instance tab: alag port ya Docker network pe bina host-port, Nginx
upstream me dono — Swarm/k8s se pehle mat.

Isme chalega: API (1), worker, web (Next.js), Postgres, Redis, Nginx.
Postgres alag VPS pe le jao jab DB CPU >60% consistently ho.

---

## 2. Docker Compose (production)

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  postgres:
    image: postgres:16.4-alpine        # NEVER :latest
    restart: unless-stopped
    environment:
      POSTGRES_DB: studyhub
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres.conf:/etc/postgresql/postgresql.conf:ro
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    ports: ["127.0.0.1:5432:5432"]     # localhost only, NEVER 0.0.0.0
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d studyhub"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits: { cpus: '3', memory: 6G }

  redis:
    image: redis:7.4-alpine
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 1gb --maxmemory-policy allkeys-lru --appendonly yes
    volumes: [redisdata:/data]
    ports: ["127.0.0.1:6379:6379"]
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s

  api:
    image: ghcr.io/yourorg/studyhub-api:${GIT_SHA}   # pinned by commit
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      postgres: { condition: service_healthy }
      redis:    { condition: service_healthy }
    ports: ["127.0.0.1:3001:3001"]
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 15s
      start_period: 30s
    mem_limit: 1g
    cpus: "1.5"
    user: "1001:1001"                   # non-root
    # NO deploy.replicas — Compose file format iske bina Swarm ignore karta hai.
    # Year-1: ek hi api. Scale later with api2 on :3002 + nginx upstream.

  worker:
    image: ghcr.io/yourorg/studyhub-api:${GIT_SHA}
    command: ["node", "dist/worker.js"]
    restart: unless-stopped
    env_file: .env.production
    depends_on:
      redis: { condition: service_healthy }
    user: "1001:1001"

  web:
    image: ghcr.io/yourorg/studyhub-web:${GIT_SHA}
    restart: unless-stopped
    env_file: .env.production
    ports: ["127.0.0.1:3000:3000"]
    user: "1001:1001"

  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on: [api, web]

volumes:
  pgdata:
  redisdata:
```

---

## 3. Nginx config (key parts)

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m   rate=100r/m;

server {
    listen 443 ssl http2;
    server_name api.studyhub.in;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    client_max_body_size 10M;         # photo uploads

    location /v1/auth/login  { limit_req zone=login burst=3 nodelay; proxy_pass http://api_upstream; }
    location /v1/auth/send-otp { limit_req zone=login burst=2 nodelay; proxy_pass http://api_upstream; }
    location / {
        limit_req zone=api burst=50 nodelay;
        proxy_pass http://api_upstream;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-Id $request_id;
    }
}

upstream api_upstream {
    least_conn;
    server 127.0.0.1:3001;
    keepalive 32;
}
```

Cloudflare use kar rahe ho to origin ko sirf Cloudflare IPs se accessible rakho
(UFW rules ya `allow` directives).

---

## 4. Postgres tuning (16GB RAM box)

```conf
# postgres.conf
shared_buffers = 4GB                  # ~25% RAM
effective_cache_size = 12GB           # ~75% RAM
work_mem = 32MB                       # per sort/hash op
maintenance_work_mem = 512MB
max_connections = 100                 # use pgbouncer if you need more
random_page_cost = 1.1                # NVMe
effective_io_concurrency = 200
wal_buffers = 16MB
checkpoint_completion_target = 0.9
max_wal_size = 4GB

# For PITR
archive_mode = on
archive_command = 'pgbackrest --stanza=studyhub archive-push %p'

# Logging slow queries
log_min_duration_statement = 500      # log queries > 500ms
log_checkpoints = on
log_lock_waits = on
```

**Connection pooling:** Prisma ka built-in pool use karo (`connection_limit=10` per
instance). 2 API instances × 10 = 20 connections, worker 10 = 30 total. 100 max se
theek hai. Zyada instances ho to PgBouncer (transaction mode) lagao.

---

## 5. Backup & Disaster Recovery

**Ye section sabse important hai. Library owner ka pura business data tumhare paas hai.**

### Backup strategy (3-2-1 rule)
- 3 copies, 2 different media, 1 offsite

```bash
#!/bin/bash
# /opt/studyhub/backup.sh  — cron: 0 2 * * *
set -euo pipefail

DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR=/var/backups/studyhub
S3_BUCKET=s3://studyhub-backups
# R2: aws --endpoint-url https://<accountid>.r2.cloudflarestorage.com
# Plain AWS_S3 without endpoint will miss the bucket if you are not on AWS.

mkdir -p "$BACKUP_DIR"

# 1. Logical dump (custom format, compressed)
docker exec studyhub-postgres pg_dump -U "$DB_USER" -Fc -Z6 studyhub \
  > "$BACKUP_DIR/db_$DATE.dump"

# 2. Verify dump is not empty / corrupt
SIZE=$(stat -c%s "$BACKUP_DIR/db_$DATE.dump")
if [ "$SIZE" -lt 100000 ]; then
  curl -X POST "$ALERT_WEBHOOK" -d "CRITICAL: backup too small ($SIZE bytes)"
  exit 1
fi
pg_restore --list "$BACKUP_DIR/db_$DATE.dump" > /dev/null || {
  curl -X POST "$ALERT_WEBHOOK" -d "CRITICAL: backup corrupt"; exit 1; }

# 3. Encrypt then upload offsite (Cloudflare R2, S3-compatible)
gpg --batch --yes --encrypt --recipient backup@studyhub.in \
  "$BACKUP_DIR/db_$DATE.dump"
# R2_ENDPOINT e.g. https://<accountid>.r2.cloudflarestorage.com
# GPG recipient key + R2 access key must exist before Phase 0 backup drill.
aws s3 cp "$BACKUP_DIR/db_$DATE.dump.gpg" "$S3_BUCKET/daily/" \
  --endpoint-url "$R2_ENDPOINT" \
  --storage-class STANDARD

# 4. Retention: 7 daily local, 30 daily + 12 monthly remote
find "$BACKUP_DIR" -name "db_*.dump*" -mtime +7 -delete

# 5. Report success
curl -X POST "$HEALTHCHECK_URL"     # dead-man's switch — no ping = alert
```

### Continuous archiving (PITR)
pgBackRest ya WAL-G se WAL archive karo → 5 minute tak ka data recover ho sakta hai.

### Restore drill — HAR MAHINE karo
```bash
# Ye untested backup ko real backup banata hai
docker run -d --name pg-restore-test postgres:16.4-alpine
gpg --decrypt db_20260901.dump.gpg | \
  docker exec -i pg-restore-test pg_restore -U postgres -d postgres -Fc
# Verify: row counts match? queries chal rahi hain?
docker exec pg-restore-test psql -U postgres -c "SELECT count(*) FROM students;"
```

**Untested backup = no backup.** Calendar me monthly reminder lagao.

### RTO/RPO targets
| | Target |
|---|---|
| RPO (kitna data kho sakta hai) | 15 minutes (WAL archive) |
| RTO (kitni der me wapas) | 2 hours |

### DR runbook (server poori tarah gaya)
1. Naya VPS provision (Terraform/Ansible se, ya manual — steps documented rakho)
2. Docker + compose install
3. `.env.production` restore (Doppler/1Password se — Git me nahi hai)
4. Latest backup download + decrypt + restore
5. WAL replay to latest point
6. DNS point karo (Cloudflare, TTL 300 rakho isliye)
7. Smoke test: login, admission, payment
8. Customers ko status page + WhatsApp update

---

## 6. Monitoring & Alerting

### Minimum viable observability (Month 1)
| Tool | Kya |
|---|---|
| Sentry | Application errors, free tier |
| UptimeRobot / BetterStack | HTTP uptime, 1-min checks, free |
| Healthchecks.io | Cron dead-man's switch (backup, reminders chale ya nahi) |
| Postgres logs | Slow query log review weekly |

### Month 6+ (Prometheus stack)
```
node_exporter        → CPU, RAM, disk, network
postgres_exporter    → connections, cache hit ratio, replication lag, slow queries
redis_exporter       → memory, ops/s, evictions
app /metrics         → request rate, latency histogram, queue depth, job failures
Grafana              → dashboards
Alertmanager         → WhatsApp/Slack alerts
```

### Alerts jo actually matter (symptom-based, not cause-based)
| Alert | Threshold | Severity |
|---|---|---|
| API 5xx rate | >1% for 5 min | P1 — page karo |
| API p99 latency | >2s for 10 min | P2 |
| Health check fail | 2 consecutive | P1 |
| Disk usage | >80% | P2 |
| Postgres connections | >80% of max | P2 |
| Backup job missed | no ping in 26h | P1 |
| Queue depth | >1000 jobs for 15 min | P2 |
| WhatsApp send failure rate | >10% | P2 |
| Payment webhook failures | >3 in 10 min | P1 (paisa involved hai) |

Har alert ke saath runbook link. Alert jo actionable nahi hai use delete karo — alert
fatigue se real alert miss ho jaata hai.

---

## 7. Security Checklist

### Application
- [ ] Passwords: bcrypt (cost 12) ya argon2id
- [ ] JWT: short-lived access (15 min) + rotating refresh, revocation list Redis me
- [ ] OTP: hashed store, 5 min expiry, max 3 attempts, rate limited per number
- [ ] SQL injection: ORM parameterized queries only, raw SQL me kabhi string concat nahi
- [ ] XSS: React auto-escape, `dangerouslySetInnerHTML` ban
- [ ] CSRF: SameSite=Strict cookies ya Bearer token only
- [ ] File upload: MIME type + magic byte check, size limit, extension whitelist,
      **kabhi user-supplied filename se store mat karo** (path traversal)
- [ ] Signed URLs for private files (15 min expiry)
- [ ] Mass assignment: DTO whitelist (class-validator `forbidNonWhitelisted`)
- [ ] IDOR: har resource fetch pe tenant_id check (RLS + code dono)
- [ ] Rate limits: login 5/min, OTP 3/hour, API 100/min per tenant
- [ ] Secrets: env vars only, `.env` in `.gitignore`, git history me scan (gitleaks)
- [ ] Dependency scan: `npm audit` in CI, Dependabot on

### Infrastructure
- [ ] SSH: key-only, root login disabled, non-standard port, fail2ban
- [ ] Firewall (UFW): only 22 (restricted IP), 80, 443 open
- [ ] DB port: localhost only, never public
- [ ] Containers: non-root user, read-only rootfs where possible, resource limits
- [ ] Images: pinned versions, Trivy scan in CI, minimal base (alpine/distroless)
- [ ] TLS: Let's Encrypt auto-renew (certbot ya Caddy), TLS 1.2+ only
- [ ] Cloudflare: WAF rules, bot fight mode, rate limiting at edge

### Data & compliance (India DPDP Act 2023)
- [ ] Privacy policy + terms published
- [ ] Consent notice at student registration
- [ ] ID proof numbers: encrypt at rest (app-level AES-256), mask in UI (XXXX-1234)
- [ ] Data retention policy: left students ka data 3 saal, phir anonymize
- [ ] Right to erasure: student delete request handle karne ka process
- [ ] Data export: owner apna data kabhi bhi le sake
- [ ] Breach notification process documented
- [ ] Sub-processor list (Razorpay, Meta, MSG91, Cloudflare) disclosed
- [ ] Data stored in India (Cloudflare R2 region, or use AWS Mumbai)

### Access control
- [ ] Production access: sirf 1-2 log, MFA mandatory
- [ ] Impersonation feature: audit logged, tenant ko notification (P1)
- [ ] Database direct access: read-only role for debugging, writes only via migration
- [ ] Quarterly access review

---

## 8. CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres: { image: postgres:16.4-alpine, env: {...} }
      redis:    { image: redis:7.4-alpine }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npx prisma migrate deploy
      - run: npm run test:unit
      - run: npm run test:integration       # includes tenant isolation suite
      - run: npm audit --audit-level=high

  build:
    needs: test
    steps:
      - run: docker build -t ghcr.io/org/studyhub-api:${{ github.sha }} .
      - uses: aquasecurity/trivy-action@master
        with: { image-ref: 'ghcr.io/org/studyhub-api:${{ github.sha }}',
                exit-code: '1', severity: 'CRITICAL,HIGH' }
      - run: docker push ghcr.io/org/studyhub-api:${{ github.sha }}

  deploy:
    needs: build
    steps:
      - name: Deploy to production
        run: |
          ssh deploy@prod << 'ENDSSH'
            cd /opt/studyhub
            export GIT_SHA=${{ github.sha }}
            docker compose pull
            docker compose run --rm api npx prisma migrate deploy
            docker compose up -d --no-deps --scale api=2 api
            sleep 20
            curl -f http://localhost:3001/health || exit 1
            docker compose up -d
          ENDSSH
      - name: Smoke test
        run: curl -f https://api.studyhub.in/health
```

**Rollback:** `GIT_SHA=<previous> docker compose up -d` — ek command me wapas.
Migration reversible rakho ya expand-contract pattern use karo (pehle column add,
phir code deploy, phir purana column drop — alag deploys me).

---

## 9. Cost breakdown (monthly)

| Item | Month 1–6 | Month 12 (**127** paying, `18` base) |
|---|---|---|
| VPS (app + db) | ₹3,500 | ₹8,000 (separate DB box if needed) |
| Backup storage (R2) | ₹200 | ₹800 |
| Object storage (photos) | ₹100 | ₹500 |
| Domain + SSL | ₹100 | ₹100 |
| Cloudflare | ₹0 (free) | ₹0–1,700 |
| Sentry | ₹0 | ₹0–2,200 |
| WhatsApp (usage) | ₹500 | ₹5,000 |
| SMS/OTP | ₹300 | ₹1,700 |
| Payment gateway | 2% of TPV | 2% |
| Email | ₹0 | ₹800 |
| **Total (excl. gateway)** | **~₹4,700** | **~₹18,000–20,000** |

Month 12 revenue ₹1.05 lakh pe infra ~18% — still OK. 300-customer column hata di;
wo forecast `18` me nahi hai.
