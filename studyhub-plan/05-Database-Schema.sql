-- ============================================================================
-- StudyHub — PostgreSQL 16 Schema
-- Multi-tenant (shared DB, tenant_id + Row Level Security)
-- Money is stored in PAISE as BIGINT (never float)
-- All timestamps in UTC (timestamptz)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";   -- needed for exclusion constraints

-- ============================================================================
-- SECTION 1: SAAS LAYER (your business)
-- ============================================================================

CREATE TABLE saas_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code                TEXT UNIQUE NOT NULL,          -- trial|starter|growth|pro|whitelabel
    name                TEXT NOT NULL,
    price_monthly       BIGINT NOT NULL DEFAULT 0,     -- paise
    price_yearly        BIGINT NOT NULL DEFAULT 0,
    max_branches        INT NOT NULL DEFAULT 1,
    max_students        INT NOT NULL DEFAULT 100,
    max_staff           INT NOT NULL DEFAULT 2,
    whatsapp_credits    INT NOT NULL DEFAULT 500,
    sms_credits         INT NOT NULL DEFAULT 200,
    features            JSONB NOT NULL DEFAULT '{}',   -- {"student_app":true,"biometric":false}
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order          INT DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    slug                TEXT UNIQUE NOT NULL,          -- studyhub.in/<slug>
    owner_name          TEXT,
    owner_mobile        TEXT NOT NULL,
    owner_email         TEXT,
    city                TEXT,
    state               TEXT,
    country             TEXT DEFAULT 'IN',
    timezone            TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    currency            TEXT NOT NULL DEFAULT 'INR',
    language            TEXT NOT NULL DEFAULT 'en',    -- en | hi
    logo_url            TEXT,
    gstin               TEXT,
    status              TEXT NOT NULL DEFAULT 'trial', -- trial|active|past_due|suspended|cancelled
    onboarding_step     INT NOT NULL DEFAULT 0,
    settings            JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;

CREATE TABLE subscriptions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES saas_plans(id),
    billing_cycle       TEXT NOT NULL DEFAULT 'monthly',  -- monthly|yearly
    amount              BIGINT NOT NULL,
    status              TEXT NOT NULL,                    -- trialing|active|past_due|cancelled
    trial_ends_at       TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end   TIMESTAMPTZ NOT NULL,
    cancelled_at        TIMESTAMPTZ,
    gateway_sub_id      TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subs_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subs_period_end ON subscriptions(current_period_end) WHERE status IN ('active','trialing');

CREATE TABLE saas_invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES subscriptions(id),
    invoice_no          TEXT NOT NULL,
    amount              BIGINT NOT NULL,
    tax_amount          BIGINT NOT NULL DEFAULT 0,
    status              TEXT NOT NULL,                    -- unpaid|paid|failed|refunded
    paid_at             TIMESTAMPTZ,
    gateway_payment_id  TEXT,
    pdf_url             TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_saas_inv_no ON saas_invoices(tenant_id, invoice_no);

CREATE TABLE credit_ledger (      -- WhatsApp / SMS credits
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel             TEXT NOT NULL,                    -- whatsapp|sms
    delta               INT NOT NULL,                     -- + topup, - usage
    balance_after       INT NOT NULL,
    reason              TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tenant ON credit_ledger(tenant_id, channel, created_at DESC);

-- ============================================================================
-- SECTION 2: ORGANISATION
-- ============================================================================

CREATE TABLE branches (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    code                TEXT NOT NULL,                   -- invoice segment, e.g. AMB
    address             TEXT,
    city                TEXT,
    pincode             TEXT,
    contact_mobile      TEXT,
    latitude            NUMERIC(10,7),
    longitude           NUMERIC(10,7),
    opening_time        TIME,
    closing_time        TIME,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_branches_tenant ON branches(tenant_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_branches_code ON branches(tenant_id, code) WHERE deleted_at IS NULL;

CREATE TABLE platform_admins (             -- super admin; NOT in RLS loop
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    mobile              TEXT NOT NULL UNIQUE,
    email               TEXT,
    password_hash       TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (                       -- owner / manager / staff — tenant_id NOT NULL
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id),
    name                TEXT NOT NULL,
    mobile              TEXT NOT NULL,
    email               TEXT,
    password_hash       TEXT,
    role                TEXT NOT NULL,     -- owner|manager|staff|accountant  (super_admin alag table)
    permissions         JSONB NOT NULL DEFAULT '{}',
    max_discount_paise  BIGINT DEFAULT 0,
    photo_url           TEXT,
    salary              BIGINT,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_users_tenant ON users(tenant_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_tenant_mobile ON users(tenant_id, mobile) WHERE deleted_at IS NULL;

CREATE TABLE otp_codes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile              TEXT NOT NULL,
    code_hash           TEXT NOT NULL,
    purpose             TEXT NOT NULL,     -- login|signup|reset|student_login
    attempts            INT NOT NULL DEFAULT 0,
    expires_at          TIMESTAMPTZ NOT NULL,
    consumed_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_mobile ON otp_codes(mobile, created_at DESC);

-- ============================================================================
-- SECTION 3: SHIFTS & SEATS
-- ============================================================================

CREATE TABLE shifts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,                  -- Morning / Noon / Evening / Full Day
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    is_overnight        BOOLEAN NOT NULL DEFAULT FALSE, -- 10PM -> 6AM
    is_full_day         BOOLEAN NOT NULL DEFAULT FALSE, -- blocks all other shifts on that seat
    color               TEXT DEFAULT '#3b82f6',
    sort_order          INT DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_shifts_branch ON shifts(branch_id) WHERE deleted_at IS NULL;

CREATE TABLE seats (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    seat_no             TEXT NOT NULL,
    floor               TEXT,
    section             TEXT,                            -- room / hall name
    seat_type           TEXT DEFAULT 'open',             -- open|cabin|ac|non_ac|window
    row_pos             INT,                             -- for visual grid
    col_pos             INT,
    status              TEXT NOT NULL DEFAULT 'available', -- available|blocked|maintenance
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_seats_branch ON seats(branch_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_seats_branch_no ON seats(branch_id, seat_no) WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 4: STUDENTS
-- ============================================================================

CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_code        TEXT NOT NULL,                   -- ST-0001
    name                TEXT NOT NULL,
    mobile              TEXT NOT NULL,
    guardian_name       TEXT,
    guardian_mobile     TEXT,
    email               TEXT,
    gender              TEXT,
    dob                 DATE,
    address             TEXT,
    city                TEXT,
    photo_url           TEXT,
    id_proof_type       TEXT,                            -- aadhaar|pan|voter|dl|college_id
    id_proof_number     TEXT,                            -- store masked/encrypted
    id_proof_url        TEXT,
    exam_target         TEXT,                            -- ssc|upsc|neet|jee|banking|board|other
    education           TEXT,
    blood_group         TEXT,
    emergency_contact   TEXT,
    status              TEXT NOT NULL DEFAULT 'active',  -- active|paused|left|blacklisted (expiring/expired derive from memberships)
    joined_on           DATE NOT NULL DEFAULT CURRENT_DATE,
    left_on             DATE,
    left_reason         TEXT,
    qr_token            TEXT UNIQUE,                     -- for attendance QR
    notes               TEXT,
    preferred_language  TEXT,                            -- en|hi; NULL = tenant.language
    notification_opt_out BOOLEAN NOT NULL DEFAULT FALSE, -- marketing/broadcast only; receipts still send
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_students_tenant_status ON students(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_students_mobile ON students(tenant_id, mobile);
CREATE INDEX idx_students_branch ON students(branch_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_students_code ON students(tenant_id, student_code) WHERE deleted_at IS NULL;
-- fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_students_name_trgm ON students USING gin (name gin_trgm_ops);

-- ============================================================================
-- SECTION 5: FEE PLANS, MEMBERSHIPS, SEAT ALLOCATION
-- ============================================================================

CREATE TABLE fee_plans (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id),
    shift_id            UUID REFERENCES shifts(id),      -- NULL = any shift
    name                TEXT NOT NULL,
    duration_days       INT,                             -- either days...
    duration_months     INT,                             -- ...or months
    amount              BIGINT NOT NULL,                 -- paise
    seat_type           TEXT,                            -- NULL = all types
    registration_fee    BIGINT NOT NULL DEFAULT 0,
    security_deposit    BIGINT NOT NULL DEFAULT 0,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CHECK (duration_days IS NOT NULL OR duration_months IS NOT NULL)
);
CREATE INDEX idx_feeplans_tenant ON fee_plans(tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE memberships (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_plan_id         UUID REFERENCES fee_plans(id),
    shift_id            UUID NOT NULL REFERENCES shifts(id),
    seat_id             UUID REFERENCES seats(id),       -- NULL = floating/no seat
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    original_end_date   DATE,                            -- before any pause extension
    base_amount         BIGINT NOT NULL,
    discount_amount     BIGINT NOT NULL DEFAULT 0,
    discount_reason     TEXT,
    registration_fee    BIGINT NOT NULL DEFAULT 0,
    security_deposit    BIGINT NOT NULL DEFAULT 0,
    total_amount        BIGINT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'active',  -- active|expired|cancelled|paused|transferred|superseded
    is_renewal          BOOLEAN NOT NULL DEFAULT FALSE,
    previous_membership_id UUID REFERENCES memberships(id),
    paused_from         DATE,
    paused_days_total   INT NOT NULL DEFAULT 0,
    cancelled_at        TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    CHECK (end_date >= start_date)
);
CREATE INDEX idx_mem_student ON memberships(student_id, start_date DESC);
CREATE INDEX idx_mem_expiry ON memberships(tenant_id, end_date) WHERE status = 'active';
CREATE INDEX idx_mem_seat ON memberships(seat_id) WHERE status = 'active';

-- THE MOST IMPORTANT TABLE: prevents double-booking a seat in the same shift
CREATE TABLE seat_allocations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    seat_id             UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    shift_id            UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    membership_id       UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    period              DATERANGE NOT NULL,              -- [from_date, to_date)
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- HARD GUARANTEE: same seat + same shift cannot have overlapping active periods
    CONSTRAINT no_double_booking EXCLUDE USING gist (
        seat_id WITH =,
        shift_id WITH =,
        period WITH &&
    ) WHERE (released_at IS NULL)
);
CREATE INDEX idx_alloc_seat ON seat_allocations(seat_id) WHERE released_at IS NULL;
CREATE INDEX idx_alloc_period ON seat_allocations USING gist (period);

-- ============================================================================
-- SECTION 6: BILLING (student-facing)
-- ============================================================================

CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    membership_id       UUID REFERENCES memberships(id),
    invoice_no          TEXT NOT NULL,
    invoice_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date            DATE,
    subtotal            BIGINT NOT NULL,
    discount_amount     BIGINT NOT NULL DEFAULT 0,
    tax_amount          BIGINT NOT NULL DEFAULT 0,
    total_amount        BIGINT NOT NULL,
    paid_amount         BIGINT NOT NULL DEFAULT 0,
    due_amount          BIGINT GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status              TEXT NOT NULL DEFAULT 'unpaid',  -- unpaid|partial|paid|cancelled
    pdf_url             TEXT,
    note                TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ,
    UNIQUE (tenant_id, invoice_no)
);
CREATE INDEX idx_inv_student ON invoices(student_id, invoice_date DESC);
CREATE INDEX idx_inv_due ON invoices(tenant_id, status) WHERE status IN ('unpaid','partial');
-- Overdue is NOT a status column — derive: status IN ('unpaid','partial') AND due_date < today

CREATE TABLE invoice_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    item_type           TEXT NOT NULL,   -- membership|registration|deposit|locker|fine|other
    description         TEXT NOT NULL,
    quantity            INT NOT NULL DEFAULT 1,
    unit_amount         BIGINT NOT NULL,
    total_amount        BIGINT NOT NULL,
    hsn_sac             TEXT,
    tax_rate            NUMERIC(5,2) DEFAULT 0
);
CREATE INDEX idx_inv_items_invoice ON invoice_items(invoice_id);

CREATE TABLE payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invoice_id          UUID REFERENCES invoices(id),
    receipt_no          TEXT NOT NULL,
    amount              BIGINT NOT NULL,
    mode                TEXT NOT NULL,   -- cash|upi|card|bank|cheque|online
    reference_no        TEXT,
    gateway_payment_id  TEXT,
    paid_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    collected_by        UUID REFERENCES users(id),
    note                TEXT,
    is_refund           BOOLEAN NOT NULL DEFAULT FALSE,
    reversed_at         TIMESTAMPTZ,
    reversed_by         UUID REFERENCES users(id),
    reversal_reason     TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (tenant_id, receipt_no)
);
CREATE INDEX idx_pay_tenant_date ON payments(tenant_id, paid_at DESC);
CREATE INDEX idx_pay_student ON payments(student_id, paid_at DESC);
CREATE INDEX idx_pay_collector ON payments(collected_by, paid_at DESC);

CREATE TABLE deposits (      -- refundable security deposit ledger
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount              BIGINT NOT NULL,                 -- + collected, - refunded/adjusted
    type                TEXT NOT NULL,                   -- collected|refunded|adjusted|forfeited
    payment_id          UUID REFERENCES payments(id),
    reason              TEXT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dep_student ON deposits(student_id);

CREATE TABLE student_advances (            -- FIFO leftover / credit notes
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount              BIGINT NOT NULL,                 -- remaining credit, paise
    source_payment_id   UUID REFERENCES payments(id),
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    consumed_at         TIMESTAMPTZ
);
CREATE INDEX idx_adv_student ON student_advances(student_id) WHERE consumed_at IS NULL;

-- ============================================================================
-- SECTION 7: ATTENDANCE
-- ============================================================================

CREATE TABLE attendance (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    shift_id            UUID REFERENCES shifts(id),
    attendance_date     DATE NOT NULL,                   -- check_in ki local date (tenant TZ)
    check_in            TIMESTAMPTZ,
    check_out           TIMESTAMPTZ,
    duration_minutes    INT,
    method              TEXT NOT NULL DEFAULT 'qr',      -- qr|manual|biometric|rfid|app
    device_id           TEXT,
    marked_by           UUID REFERENCES users(id),
    is_auto_checkout    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    -- NO UNIQUE(student_id, attendance_date): lunch-out + wapas = doosri session
);
CREATE INDEX idx_att_date ON attendance(tenant_id, attendance_date DESC);
CREATE INDEX idx_att_student ON attendance(student_id, attendance_date DESC);
-- Ek waqt pe ek hi open session (check_out NULL), overnight midnight ke across bhi
CREATE UNIQUE INDEX idx_att_open_session ON attendance(student_id) WHERE check_out IS NULL;

-- ============================================================================
-- SECTION 8: EXPENSES
-- ============================================================================

CREATE TABLE expense_categories (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    is_default          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE expenses (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    category_id         UUID REFERENCES expense_categories(id),
    amount              BIGINT NOT NULL,
    expense_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode        TEXT DEFAULT 'cash',
    vendor              TEXT,
    bill_url            TEXT,
    note                TEXT,
    is_recurring        BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_day      INT,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_exp_tenant_date ON expenses(tenant_id, expense_date DESC) WHERE deleted_at IS NULL;

-- ============================================================================
-- SECTION 9: NOTIFICATIONS
-- ============================================================================

CREATE TABLE notification_templates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- NULL = system default
    code                TEXT NOT NULL,     -- welcome|receipt|fee_reminder_5d|expiry|overdue...
    channel             TEXT NOT NULL,     -- whatsapp|sms|push|email
    language            TEXT NOT NULL DEFAULT 'en',
    provider_template_id TEXT,             -- Meta/DLT approved template name
    body                TEXT NOT NULL,
    variables           JSONB DEFAULT '[]',
    is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- system defaults tenant_id IS NULL; tenant copies have tenant_id set
CREATE UNIQUE INDEX idx_notif_tpl ON notification_templates (
    COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid),
    code, channel, language
);

CREATE TABLE notification_log (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    template_code       TEXT NOT NULL,
    channel             TEXT NOT NULL,
    recipient           TEXT NOT NULL,
    body                TEXT,
    status              TEXT NOT NULL DEFAULT 'queued',  -- queued|sent|delivered|read|failed
    provider_msg_id     TEXT,
    error               TEXT,
    dedupe_key          TEXT,                             -- prevents duplicate sends
    sent_at             TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_notif_dedupe ON notification_log(dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_notif_tenant ON notification_log(tenant_id, created_at DESC);

CREATE TABLE notices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id),
    title               TEXT NOT NULL,
    body                TEXT NOT NULL,
    valid_from          DATE,
    valid_till          DATE,
    is_pinned           BOOLEAN DEFAULT FALSE,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 10: LEADS, LOCKERS, COMPLAINTS
-- ============================================================================

CREATE TABLE leads (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID REFERENCES branches(id),
    name                TEXT NOT NULL,
    mobile              TEXT NOT NULL,
    interested_shift_id UUID REFERENCES shifts(id),
    source              TEXT,              -- walkin|referral|google|instagram|website|other
    status              TEXT NOT NULL DEFAULT 'new',  -- new|contacted|visited|converted|lost
    follow_up_date      DATE,
    lost_reason         TEXT,
    converted_student_id UUID REFERENCES students(id),
    note                TEXT,
    assigned_to         UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_followup ON leads(tenant_id, follow_up_date) WHERE status NOT IN ('converted','lost');

CREATE TABLE waiting_list (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    shift_id            UUID REFERENCES shifts(id),
    name                TEXT NOT NULL,
    mobile              TEXT NOT NULL,
    priority            INT DEFAULT 0,
    notified_at         TIMESTAMPTZ,
    status              TEXT DEFAULT 'waiting',   -- waiting|notified|converted|cancelled
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE lockers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    locker_no           TEXT NOT NULL,
    size                TEXT,
    monthly_rent        BIGINT DEFAULT 0,
    key_deposit         BIGINT DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'available',  -- available|assigned|maintenance
    UNIQUE (branch_id, locker_no)
);

CREATE TABLE locker_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    locker_id           UUID NOT NULL REFERENCES lockers(id) ON DELETE CASCADE,
    student_id          UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    from_date           DATE NOT NULL,
    to_date             DATE,
    released_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT no_double_locker EXCLUDE USING gist (
        locker_id WITH =,
        daterange(from_date, COALESCE(to_date, 'infinity'::date), '[)') WITH &&
    ) WHERE (released_at IS NULL)
);

CREATE TABLE complaints (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    student_id          UUID REFERENCES students(id) ON DELETE SET NULL,
    category            TEXT NOT NULL,     -- ac|wifi|cleanliness|noise|water|light|furniture|other
    description         TEXT NOT NULL,
    photo_url           TEXT,
    status              TEXT NOT NULL DEFAULT 'open',  -- open|in_progress|resolved|closed
    assigned_to         UUID REFERENCES users(id),
    resolved_at         TIMESTAMPTZ,
    resolution_note     TEXT,
    rating              INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- SECTION 11: AUDIT & SYSTEM
-- ============================================================================

CREATE TABLE activity_logs (
    id                  BIGSERIAL PRIMARY KEY,
    tenant_id           UUID REFERENCES tenants(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    action              TEXT NOT NULL,     -- payment.create|student.delete|discount.apply
    entity_type         TEXT,
    entity_id           UUID,
    old_values          JSONB,
    new_values          JSONB,
    ip_address          INET,
    user_agent          TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_tenant ON activity_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_entity ON activity_logs(entity_type, entity_id);

CREATE TABLE files (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    owner_type          TEXT,              -- student|expense|complaint|tenant
    owner_id            UUID,
    file_name           TEXT NOT NULL,
    mime_type           TEXT,
    size_bytes          BIGINT,
    storage_key         TEXT NOT NULL,
    is_sensitive        BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE counters (                    -- race-safe INV/RCP — UPDATE ... RETURNING, never MAX()+1
    tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id           UUID NOT NULL REFERENCES branches(id),
    type                TEXT NOT NULL,     -- invoice|receipt
    fy                  TEXT NOT NULL,     -- Indian FY '2627'
    last_no             INT NOT NULL DEFAULT 0,
    PRIMARY KEY (tenant_id, branch_id, type, fy)
);

CREATE TABLE webhook_events (              -- Razorpay (and later Cashfree) idempotency
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider            TEXT NOT NULL,     -- razorpay|cashfree
    event_id            TEXT NOT NULL,
    event_type          TEXT,
    payload             JSONB NOT NULL,
    processed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, event_id)
);

-- ============================================================================
-- SECTION 12: ROW LEVEL SECURITY (apply to every tenant table)
-- ============================================================================

-- ENABLE is not enough: the TABLE OWNER bypasses RLS unless FORCE is on.
-- App connects as studyhub_app (NOT owner, NOT superuser, NO BYPASSRLS).
-- SET LOCAL / set_config(..., true) ONLY inside a transaction — see 04.

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'branches','users','shifts','seats','students','fee_plans','memberships',
    'seat_allocations','invoices','invoice_items','payments','deposits',
    'student_advances','attendance','expenses','expense_categories',
    'notification_log','notices','leads','waiting_list','lockers',
    'locker_assignments','complaints','activity_logs','files',
    'subscriptions','saas_invoices','credit_ledger','counters'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', t);
    EXECUTE format($f$
      CREATE POLICY tenant_isolation ON %I
      USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
      WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
    $f$, t);
  END LOOP;
END $$;

-- notification_templates: tenants read system defaults (tenant_id IS NULL) + own rows
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates FORCE ROW LEVEL SECURITY;
CREATE POLICY notif_tpl_select ON notification_templates
  FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = current_setting('app.tenant_id', true)::uuid
  );
CREATE POLICY notif_tpl_write ON notification_templates
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- platform_admins, otp_codes, webhook_events, saas_plans: no tenant RLS
-- (webhook_events is platform-wide; access only from worker with app role grants)
-- tenants: own-row policy (id = GUC), not tenant_id column — see below.

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation_self ON tenants;
CREATE POLICY tenant_isolation_self ON tenants
  USING (id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (id = current_setting('app.tenant_id', true)::uuid);

-- Application role (NOT table owner, NOT superuser, NO BYPASSRLS).
-- Password is set outside this file. Tests use SET ROLE from a superuser.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'studyhub_app') THEN
    CREATE ROLE studyhub_app
      LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
      PASSWORD NULL;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO studyhub_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studyhub_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studyhub_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO studyhub_app;

-- Platform admin listing all tenants uses a separate BYPASSRLS/superuser role, never studyhub_app.
-- Every request: BEGIN; SELECT set_config('app.tenant_id', '<uuid>', true); ... COMMIT;

-- ============================================================================
-- SECTION 13: HELPFUL VIEWS
-- ============================================================================

CREATE VIEW v_active_students AS
SELECT s.*, m.end_date, m.seat_id, m.shift_id
FROM students s
JOIN memberships m ON m.student_id = s.id AND m.status = 'active'
WHERE s.deleted_at IS NULL;

CREATE VIEW v_student_dues AS
SELECT i.tenant_id, i.student_id, s.name, s.mobile,
       SUM(i.due_amount) AS total_due,
       MIN(i.due_date)   AS oldest_due_date,
       CURRENT_DATE - MIN(i.due_date) AS days_overdue
FROM invoices i
JOIN students s ON s.id = i.student_id
WHERE i.status IN ('unpaid','partial') AND i.deleted_at IS NULL
GROUP BY i.tenant_id, i.student_id, s.name, s.mobile;

CREATE VIEW v_seat_occupancy AS
WITH seat_counts AS (
    SELECT tenant_id, branch_id, COUNT(*)::int AS total_seats
    FROM seats
    WHERE deleted_at IS NULL AND status = 'available'
    GROUP BY tenant_id, branch_id
),
occupied AS (
    SELECT sa.tenant_id, se.branch_id, sa.shift_id,
           COUNT(DISTINCT sa.seat_id)::int AS occupied_seats
    FROM seat_allocations sa
    JOIN seats se ON se.id = sa.seat_id
    WHERE sa.released_at IS NULL
      AND sa.period @> CURRENT_DATE
    GROUP BY sa.tenant_id, se.branch_id, sa.shift_id
)
SELECT sh.tenant_id, sh.branch_id, sh.id AS shift_id, sh.name AS shift_name,
       sc.total_seats,
       COALESCE(o.occupied_seats, 0) AS occupied_seats
FROM shifts sh
JOIN seat_counts sc ON sc.branch_id = sh.branch_id AND sc.tenant_id = sh.tenant_id
LEFT JOIN occupied o ON o.shift_id = sh.id
WHERE sh.deleted_at IS NULL AND sh.is_active;

-- ============================================================================
-- SEED: default SaaS plans
-- ============================================================================
INSERT INTO saas_plans (code,name,price_monthly,price_yearly,max_branches,max_students,max_staff,whatsapp_credits,sms_credits,features,sort_order) VALUES
('trial','Free Trial',0,0,1,30,2,100,50,'{"student_app":false,"biometric":false,"online_payment":false}',0),
('starter','Starter',49900,499000,1,100,2,500,300,'{"student_app":false,"biometric":false,"online_payment":false}',1),
('growth','Growth',99900,999000,2,300,5,2000,1000,'{"student_app":true,"biometric":true,"online_payment":true}',2),
('pro','Pro',199900,1999000,10,999999,20,5000,3000,'{"student_app":true,"biometric":true,"online_payment":true,"gst":true,"api":true}',3),
('whitelabel','White Label',499900,4999000,999,999999,999,10000,5000,'{"student_app":true,"biometric":true,"online_payment":true,"gst":true,"api":true,"branded_app":true,"custom_domain":true}',4);
