-- 0002: app role + tenants RLS (P0-40, P0-41)
-- Rollback: AUDIT/migrations/0002_down.sql

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'studyhub_app') THEN
    CREATE ROLE studyhub_app
      LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE
      NOBYPASSRLS
      PASSWORD NULL;
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO studyhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studyhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studyhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyhub_app;

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation_self ON tenants;
CREATE POLICY tenant_isolation_self ON tenants
  USING (id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.tenant_id', true)::uuid);
