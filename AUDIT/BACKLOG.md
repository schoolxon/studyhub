# StudyHub hostile audit — backlog

Canonical spec folder: `studyhub-plan/`. Schema SoT: `05-Database-Schema.sql`.
Scratch DB `studyhub_audit`. Suite: `node AUDIT/tests/run-all.mjs`.

| Sev | Open | Verified | Wontfix | Total |
|-----|------|----------|---------|-------|
| P0  | 0    | 10       | 1       | 11    |
| P1  | 0    | 16       | 0       | 16    |
| P2  | 1    | 10       | 0       | 11    |
| P3  | 0    | 3        | 0       | 3     |

---

## P0

| ID | Status | Evidence |
|----|--------|----------|
| P0-01 | VERIFIED | SQL test: SET LOCAL dies at autocommit; session SET leaks. Nest interceptor still Q-01. |
| P0-02 | VERIFIED | students FORCE true on scratch |
| P0-03 | VERIFIED | users.tenant_id NOT NULL; NULL insert fails; platform_admins exists |
| P0-04 | VERIFIED | all tenant_id tables + tenants own-row RLS |
| P0-05 | VERIFIED | no float amount columns; FIFO paise helper |
| P0-06 | VERIFIED | sequential GiST reject |
| P0-36 | VERIFIED | 05 applied to studyhub_audit |
| P0-37 | WONTFIX | Firebase apiKey in git HEAD — human must rotate (Q-05) |
| P0-40 | VERIFIED | tenants FORCE + app role count=0 without GUC |
| P0-41 | VERIFIED | studyhub_app NOSUPERUSER NOBYPASSRLS |
| P0-42 | VERIFIED | concurrent two-connection: 1 ok / 1 exclusion |

---

## P1

| ID | Status |
|----|--------|
| P1-07 counters | VERIFIED |
| P1-08 webhook_events | VERIFIED |
| P1-09 student_advances | VERIFIED (table; API unbuilt) |
| P1-10 student_requests | VERIFIED (0003 + 05) |
| P1-11 branches.code | VERIFIED |
| P1-12 preferred_language / opt_out | VERIFIED |
| P1-13 refresh_tokens | VERIFIED (table; Redis optional) |
| P1-14 date math | VERIFIED |
| P1-15 derived expiry | VERIFIED (lib + 04 job text) |
| P1-16 dual membership roster | VERIFIED (lib) |
| P1-17 renew superseded | VERIFIED |
| P1-18 membership_pauses hold_charge_paise default 0 | VERIFIED |
| P1-19 attendance open session | VERIFIED |
| P1-20 partial unique invoice/locker | VERIFIED |
| P1-21 locker GiST | VERIFIED |
| P1-22 occupancy view | VERIFIED |

---

## P2 / P3

| ID | Status |
|----|--------|
| P2-23…P2-31 | VERIFIED (docs v1.1) |
| P2-32 stack | OPEN (Q-01) |
| P2-38 folder name | VERIFIED (README studyhub-plan/) |
| P3-33 compose replicas | VERIFIED (docs) |
| P3-34 R2 endpoint | VERIFIED (`16` + Phase 0 GPG) |
| P3-35 thermal | VERIFIED |
