-- Rollback 0002. Does not DROP studyhub_app if other DBs use it.

DROP POLICY IF EXISTS tenant_isolation_self ON tenants;
ALTER TABLE tenants NO FORCE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM studyhub_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM studyhub_app;
REVOKE USAGE ON SCHEMA public FROM studyhub_app;
DROP ROLE IF EXISTS studyhub_app;
