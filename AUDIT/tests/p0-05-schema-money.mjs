import { query, requireDb } from "./_pg.mjs";

requireDb();
const failures = [];

const floats = query(`
SELECT COALESCE(string_agg(table_name || '.' || column_name, ','), '')
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type IN ('real', 'double precision')
  AND (column_name ILIKE '%amount%' OR column_name ILIKE '%price%' OR column_name ILIKE '%fee%'
       OR column_name ILIKE '%deposit%' OR column_name ILIKE '%rent%' OR column_name ILIKE '%salary%')
`);
if (floats) {
  failures.push(`float money columns: ${floats}`);
}

const numericMoney = query(`
SELECT COALESCE(string_agg(table_name || '.' || column_name, ','), '')
FROM information_schema.columns
WHERE table_schema = 'public'
  AND data_type = 'numeric'
  AND column_name ILIKE '%amount%'
`);
if (numericMoney) {
  failures.push(`numeric amount columns: ${numericMoney}`);
}

if (failures.length) {
  console.error("FAIL P0-05 schema\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P0-05 schema has no float/numeric money amounts");
