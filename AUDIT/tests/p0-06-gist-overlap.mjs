/**
 * P0-06: applied GiST must reject overlapping seat+shift allocations.
 * Env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE PSQL_PATH
 */
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

const psql =
  process.env.PSQL_PATH ||
  "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";
const db = process.env.PGDATABASE;
if (!db) {
  console.error("PGDATABASE is required");
  process.exit(2);
}

function psqlArgs(extra) {
  return [
    "-h",
    process.env.PGHOST || "127.0.0.1",
    "-p",
    process.env.PGPORT || "5432",
    "-U",
    process.env.PGUSER || "postgres",
    "-d",
    db,
    ...extra,
  ];
}

function query(sql) {
  const raw = execFileSync(psql, psqlArgs(["-At", "-c", sql]), {
    encoding: "utf8",
    env: process.env,
  }).trim();
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const uuid = lines.find((l) => /^[0-9a-f-]{36}$/i.test(l));
  return uuid || lines[0];
}

function queryOkOrError(sql) {
  try {
    execFileSync(psql, psqlArgs(["-At", "-v", "ON_ERROR_STOP=1", "-c", sql]), {
      encoding: "utf8",
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { ok: true, err: "" };
  } catch (e) {
    const err = `${e.stderr || ""}${e.stdout || ""}${e.message || ""}`;
    return { ok: false, err };
  }
}

const tag = randomUUID().slice(0, 8);
const tenantId = query(`
INSERT INTO tenants (name, slug, owner_mobile)
VALUES ('Audit ${tag}', 'audit-${tag}', '9000000000')
RETURNING id
`);
const branchId = query(`
INSERT INTO branches (tenant_id, name, code)
VALUES ('${tenantId}', 'Main', 'AMB')
RETURNING id
`);
const shiftId = query(`
INSERT INTO shifts (tenant_id, branch_id, name, start_time, end_time)
VALUES ('${tenantId}', '${branchId}', 'Morning', '06:00', '12:00')
RETURNING id
`);
const seatId = query(`
INSERT INTO seats (tenant_id, branch_id, seat_no)
VALUES ('${tenantId}', '${branchId}', 'A-01')
RETURNING id
`);
const studentA = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-A', 'Riya', '9111111111')
RETURNING id
`);
const studentB = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-B', 'Aman', '9222222222')
RETURNING id
`);
const memA = query(`
INSERT INTO memberships (
  tenant_id, branch_id, student_id, shift_id, seat_id,
  start_date, end_date, base_amount, total_amount
) VALUES (
  '${tenantId}', '${branchId}', '${studentA}', '${shiftId}', '${seatId}',
  '2026-09-01', '2026-09-30', 80000, 80000
) RETURNING id
`);
const memB = query(`
INSERT INTO memberships (
  tenant_id, branch_id, student_id, shift_id, seat_id,
  start_date, end_date, base_amount, total_amount
) VALUES (
  '${tenantId}', '${branchId}', '${studentB}', '${shiftId}', '${seatId}',
  '2026-09-01', '2026-09-30', 80000, 80000
) RETURNING id
`);

const first = queryOkOrError(`
INSERT INTO seat_allocations (
  tenant_id, seat_id, shift_id, membership_id, student_id, period
) VALUES (
  '${tenantId}', '${seatId}', '${shiftId}', '${memA}', '${studentA}',
  daterange('2026-09-01', '2026-10-01', '[)')
)
`);
if (!first.ok) {
  console.error("FAIL P0-06 first allocation should succeed\n" + first.err);
  process.exit(1);
}

const second = queryOkOrError(`
INSERT INTO seat_allocations (
  tenant_id, seat_id, shift_id, membership_id, student_id, period
) VALUES (
  '${tenantId}', '${seatId}', '${shiftId}', '${memB}', '${studentB}',
  daterange('2026-09-15', '2026-10-15', '[)')
)
`);
if (second.ok) {
  console.error("FAIL P0-06 overlapping allocation was accepted");
  process.exit(1);
}
const hit =
  second.err.includes("no_double_booking") ||
  second.err.toLowerCase().includes("exclusion");
if (!hit) {
  console.error("FAIL P0-06 overlap failed for the wrong reason\n" + second.err);
  process.exit(1);
}

console.log("PASS P0-06 overlapping seat+shift allocation rejected by GiST");
