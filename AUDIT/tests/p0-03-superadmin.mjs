import { query, queryOkOrError, requireDb } from "./_pg.mjs";

requireDb();
const failures = [];

const nullable = query(`
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'tenant_id'
`);
if (nullable !== "NO") {
  failures.push(`P0-03 users.tenant_id nullable=${nullable}`);
}

const bad = queryOkOrError(`
INSERT INTO users (name, mobile, role) VALUES ('God', '9000000001', 'super_admin')
`);
if (bad.ok) {
  failures.push("P0-03 NULL tenant_id insert succeeded");
}

const admins = query(`SELECT COUNT(*) FROM pg_class WHERE relname = 'platform_admins' AND relkind = 'r'`);
if (admins !== "1") failures.push("platform_admins missing");

if (failures.length) {
  console.error("FAIL P0-03\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P0-03 users.tenant_id NOT NULL; platform_admins exists");
