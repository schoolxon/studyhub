import { query, queryOkOrError, requireDb } from "./_pg.mjs";
import { randomUUID } from "node:crypto";

requireDb();
const tag = randomUUID().slice(0, 8);
const tenantId = query(`
INSERT INTO tenants (name, slug, owner_mobile)
VALUES ('Lock ${tag}', 'lock-${tag}', '9555555555') RETURNING id
`);
const branchId = query(`
INSERT INTO branches (tenant_id, name, code)
VALUES ('${tenantId}', 'Main', 'AMB') RETURNING id
`);
const lockerId = query(`
INSERT INTO lockers (tenant_id, branch_id, locker_no)
VALUES ('${tenantId}', '${branchId}', 'L-01') RETURNING id
`);
const studentA = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-LA', 'A', '9611111111') RETURNING id
`);
const studentB = query(`
INSERT INTO students (tenant_id, branch_id, student_code, name, mobile)
VALUES ('${tenantId}', '${branchId}', 'ST-LB', 'B', '9622222222') RETURNING id
`);

const first = queryOkOrError(`
INSERT INTO locker_assignments (tenant_id, locker_id, student_id, from_date, to_date)
VALUES ('${tenantId}', '${lockerId}', '${studentA}', '2026-09-01', '2026-12-01')
`);
if (!first.ok) {
  console.error("FAIL P1-21 first locker assign\n" + first.err);
  process.exit(1);
}
const second = queryOkOrError(`
INSERT INTO locker_assignments (tenant_id, locker_id, student_id, from_date, to_date)
VALUES ('${tenantId}', '${lockerId}', '${studentB}', '2026-10-01', '2026-11-01')
`);
if (second.ok) {
  console.error("FAIL P1-21 overlapping locker accepted");
  process.exit(1);
}
if (!second.err.includes("no_double_locker") && !second.err.toLowerCase().includes("exclusion")) {
  console.error("FAIL P1-21 wrong error\n" + second.err);
  process.exit(1);
}
console.log("PASS P1-21 overlapping locker assignment rejected");
