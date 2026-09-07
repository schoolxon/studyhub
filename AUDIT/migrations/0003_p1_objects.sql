-- 0003: remaining P1 schema objects (requests, refresh, pauses, partial uniques)
-- Rollback: 0003_down.sql

CREATE TABLE IF NOT EXISTS student_requests (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type                TEXT NOT NULL,     -- seat_change|pause|leave
    payload             JSONB NOT NULL DEFAULT '{}',
    status              TEXT NOT NULL DEFAULT 'open',  -- open|approved|rejected|cancelled
    decided_by          UUID REFERENCES users(id),
    decided_at          TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_student_requests_tenant ON student_requests(tenant_id, status);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash          TEXT NOT NULL UNIQUE,
    expires_at          TIMESTAMPTZ NOT NULL,
    revoked_at          TIMESTAMPTZ,
    replaced_by         UUID REFERENCES refresh_tokens(id),
    user_agent          TEXT,
    ip_address          INET,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refresh_user ON refresh_tokens(user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS membership_pauses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    membership_id       UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    paused_from         DATE NOT NULL,
    resumed_on          DATE,
    days                INT,
    hold_charge_paise   BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mpause_mem ON membership_pauses(membership_id);

ALTER TABLE lockers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_tenant_id_invoice_no_key;
DROP INDEX IF EXISTS invoices_tenant_id_invoice_no_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_no_alive
  ON invoices(tenant_id, invoice_no) WHERE deleted_at IS NULL;

ALTER TABLE lockers DROP CONSTRAINT IF EXISTS lockers_branch_id_locker_no_key;
DROP INDEX IF EXISTS lockers_branch_id_locker_no_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lockers_no_alive
  ON lockers(branch_id, locker_no) WHERE deleted_at IS NULL;

ALTER TABLE student_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_requests FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON student_requests;
CREATE POLICY tenant_isolation ON student_requests
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE membership_pauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_pauses FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON membership_pauses;
CREATE POLICY tenant_isolation ON membership_pauses
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON student_requests, refresh_tokens, membership_pauses TO studyhub_app;
