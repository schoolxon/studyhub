import { query, requireDb } from "./_pg.mjs";

requireDb();
const failures = [];
for (const t of ["student_requests", "refresh_tokens", "membership_pauses"]) {
  const n = query(`SELECT COUNT(*) FROM pg_class WHERE relname = '${t}' AND relkind = 'r'`);
  if (n !== "1") failures.push(`missing table ${t}`);
}
const inv = query(`
SELECT COUNT(*) FROM pg_indexes
WHERE indexname = 'idx_invoices_no_alive'
`);
if (inv !== "1") failures.push("missing idx_invoices_no_alive");
const loc = query(`
SELECT COUNT(*) FROM pg_indexes WHERE indexname = 'idx_lockers_no_alive'
`);
if (loc !== "1") failures.push("missing idx_lockers_no_alive");
const hold = query(`
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'membership_pauses' AND column_name = 'hold_charge_paise'
`);
if (hold !== "1") failures.push("membership_pauses.hold_charge_paise missing");

if (failures.length) {
  console.error("FAIL P1 schema 0003\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P1-10/13/18/20 schema objects present");
