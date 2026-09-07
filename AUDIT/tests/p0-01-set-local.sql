-- Single session. Autocommit on unless BEGIN.
SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-000000000001', true);
SELECT COALESCE(current_setting('app.tenant_id', true), '') AS local_outside_txn;

BEGIN;
SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-00000000000a', true);
SELECT current_setting('app.tenant_id', true) AS local_inside_txn;
COMMIT;
SELECT COALESCE(current_setting('app.tenant_id', true), '') AS after_commit;

SELECT set_config('app.tenant_id', '00000000-0000-0000-0000-00000000000b', false);
SELECT current_setting('app.tenant_id', true) AS session_set;
SELECT set_config('app.tenant_id', '', false);
