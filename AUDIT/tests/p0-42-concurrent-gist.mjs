import { query, spawnSql, requireDb } from "./_pg.mjs";
import { randomUUID } from "node:crypto";

requireDb();
const tag = randomUUID().slice(0, 8);

const tenantId = query(`
INSERT INTO tenants (name, slug, owner_mobile)
VALUES ('Race ${tag}', 'race-${tag}', '9333333333') RETURNING id
`);
const branchId = query(`
INSERT INTO branches (tenant_id, name, code)
VALUES ('${tenantId}', 'Main', 'AMB') RETURNING id
`);
const shiftId = query(`
INSERT INTO shifts (tenant_id, branch_id, name, start_time, end_time)
VALUES ('${tenantId}', '${branchId}', 'Morning', '06:00', '12:00') RETURNING id
`);
const seatId = query(`
INSERT INTO seats (tenant_id, branch_id, seat_no)
VALUES ('${tenantId}', '${branchId}', 'R-01') RETURNING id
`);
const studentA = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-RA', 'A', '9411111111') RETURNING id
`);
const studentB = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-RB', 'B', '9422222222') RETURNING id
`);
const memA = query(`
INSERT INTO memberships (tenant_id, branch_id, student_id, shift_id, seat_id, start_date, end_date, base_amount, total_amount)
VALUES ('${tenantId}', '${branchId}', '${studentA}', '${shiftId}', '${seatId}', '2026-10-01', '2026-10-31', 1, 1) RETURNING id
`);
const memB = query(`
INSERT INTO memberships (tenant_id, branch_id, student_id, shift_id, seat_id, start_date, end_date, base_amount, total_amount)
VALUES ('${tenantId}', '${branchId}', '${studentB}', '${shiftId}', '${seatId}', '2026-10-01', '2026-10-31', 1, 1) RETURNING id
`);

const sqlA = `INSERT INTO seat_allocations (tenant_id, seat_id, shift_id, membership_id, student_id, period)
VALUES ('${tenantId}', '${seatId}', '${shiftId}', '${memA}', '${studentA}', daterange('2026-10-01','2026-11-01','[)'))`;
const sqlB = `INSERT INTO seat_allocations (tenant_id, seat_id, shift_id, membership_id, student_id, period)
VALUES ('${tenantId}', '${seatId}', '${shiftId}', '${memB}', '${studentB}', daterange('2026-10-01','2026-11-01','[)'))`;

const [a, b] = await Promise.all([spawnSql(sqlA), spawnSql(sqlB)]);
const ok = [a, b].filter((r) => r.code === 0).length;
const excluded = [a, b].filter(
  (r) => r.code !== 0 && `${r.stderr}${r.stdout}`.includes("no_double_booking")
).length;

if (ok !== 1 || excluded !== 1) {
  console.error(`FAIL P0-42 concurrent result ok=${ok} excluded=${excluded}`);
  console.error("A", a.code, a.stderr || a.stdout);
  console.error("B", b.code, b.stderr || b.stdout);
  process.exit(1);
}
console.log("PASS P0-42 concurrent duplicate: exactly one insert, one exclusion");
