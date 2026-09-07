/**
 * P0-40: tenants must be RLS-forced for non-owner app role.
 * P0-41: studyhub_app exists, NOSUPERUSER, NOBYPASSRLS, not table owner.
 * Env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
 */
import { execFileSync } from "node:child_process";

const psql =
  process.env.PSQL_PATH ||
  "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";
const db = process.env.PGDATABASE;
if (!db) {
  console.error("PGDATABASE is required");
  process.exit(2);
}

function query(sql) {
  const raw = execFileSync(
    psql,
    [
      "-h",
      process.env.PGHOST || "127.0.0.1",
      "-p",
      process.env.PGPORT || "5432",
      "-U",
      process.env.PGUSER || "postgres",
      "-d",
      db,
      "-At",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    { encoding: "utf8", env: process.env }
  ).trim();
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const skip = new Set(["SET", "CREATE ROLE", "GRANT", "ALTER TABLE", "CREATE POLICY", "DO"]);
  const useful = lines.filter((l) => !skip.has(l) && !l.startsWith("CREATE ") && !l.startsWith("ALTER "));
  return useful[useful.length - 1] || lines[lines.length - 1] || "";
}

const failures = [];

const role = query(`
SELECT COUNT(*) FROM pg_roles WHERE rolname = 'studyhub_app'
`);
if (role !== "1") {
  failures.push(`P0-41 studyhub_app missing (count=${role})`);
}

const flags = query(`
SELECT COALESCE(
  (SELECT format('%s,%s,%s', rolsuper, rolbypassrls, rolname)
   FROM pg_roles WHERE rolname = 'studyhub_app'),
  'missing'
)
`);
if (flags !== "f,f,studyhub_app") {
  failures.push(`P0-41 studyhub_app must be NOSUPERUSER NOBYPASSRLS (got ${flags})`);
}

const owner = query(`
SELECT pg_get_userbyid(relowner) FROM pg_class WHERE relname = 'tenants' AND relkind = 'r'
`);
if (owner === "studyhub_app") {
  failures.push("P0-41 studyhub_app must not own tenants");
}

const force = query(`
SELECT COALESCE(relforcerowsecurity::text, '') FROM pg_class WHERE relname = 'tenants' AND relkind = 'r'
`);
const forceOn = force === "t" || force.toLowerCase() === "true";
if (!forceOn) {
  failures.push(`P0-40 tenants FORCE RLS not true (got ${force || "empty"})`);
}

if (role === "1") {
  const leaked = query(`
SET ROLE studyhub_app;
SELECT COUNT(*)::text FROM tenants;
`);
  if (leaked !== "0") {
    failures.push(`P0-40 studyhub_app sees ${leaked} tenant rows without GUC (want 0)`);
  }
}

if (failures.length) {
  console.error("FAIL\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}

console.log("PASS P0-40/41 tenants FORCE + app role cannot list all libraries");
