import { query, queryOkOrError, requireDb } from "./_pg.mjs";
import { randomUUID } from "node:crypto";

requireDb();
const tag = randomUUID().slice(0, 8);
const tenantId = query(`INSERT INTO tenants (name, slug, owner_mobile) VALUES ('Inv ${tag}', 'inv-${tag}', '9777777777') RETURNING id`);
const branchId = query(`INSERT INTO branches (tenant_id, name, code) VALUES ('${tenantId}', 'Main', 'AMB') RETURNING id`);
const studentId = query(`INSERT INTO students (tenant_id, branch_id, student_code, name, mobile) VALUES ('${tenantId}', '${branchId}', 'ST-INV', 'I', '9811111111') RETURNING id`);
const first = queryOkOrError(`
INSERT INTO invoices (tenant_id, branch_id, student_id, invoice_no, subtotal, total_amount)
VALUES ('${tenantId}', '${branchId}', '${studentId}', 'INV/2627/AMB/0001', 100, 100)
`);
if (!first.ok) {
  console.error("FAIL P1-20 first invoice\n" + first.err);
  process.exit(1);
}
query(`UPDATE invoices SET deleted_at = now() WHERE tenant_id = '${tenantId}' AND invoice_no = 'INV/2627/AMB/0001'`);
const reuse = queryOkOrError(`
INSERT INTO invoices (tenant_id, branch_id, student_id, invoice_no, subtotal, total_amount)
VALUES ('${tenantId}', '${branchId}', '${studentId}', 'INV/2627/AMB/0001', 100, 100)
`);
if (!reuse.ok) {
  console.error("FAIL P1-20 cannot reuse invoice_no after soft delete\n" + reuse.err);
  process.exit(1);
}
console.log("PASS P1-20 invoice_no reusable after soft delete");
