# Scratch migrations

`studyhub-plan/05-Database-Schema.sql` is migration **0001** (schema SoT).

Applied this session to database `studyhub_audit` (created 2026-09-07, empty before apply).

0002: `0002_tenants_rls.sql` — `studyhub_app` + tenants FORCE/policy.

## Rollback

```bash
# Only drop a DB created for this audit
psql -d postgres -c "DROP DATABASE studyhub_audit;"
```

Or object-level: `0001_down.sql` in this folder.
