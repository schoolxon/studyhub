/**
 * Catalog proof for P0-36 / P0-02 / P0-06.
 * Uses libpq env: PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE.
 * Never commit credentials. Target must be a scratch DB created this session.
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
  return execFileSync(
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
      "-c",
      sql,
    ],
    { encoding: "utf8", env: process.env }
  ).trim();
}

const failures = [];

const students = query(
  "SELECT COUNT(*) FROM pg_class WHERE relname = 'students' AND relkind = 'r'"
);
if (students !== "1") {
  failures.push(`P0-36 students table missing (count=${students})`);
}

const force = query(
  "SELECT COALESCE(relforcerowsecurity::text, '') FROM pg_class WHERE relname = 'students' AND relkind = 'r'"
);
const forceOn = force === "t" || force.toLowerCase() === "true";
if (!forceOn) {
  failures.push(`P0-02 students FORCE RLS not true (got ${force || "empty"})`);
}

const gist = query(
  "SELECT COUNT(*) FROM pg_constraint WHERE conname = 'no_double_booking'"
);
if (gist !== "1") {
  failures.push(`P0-06 no_double_booking missing (count=${gist})`);
}

if (failures.length) {
  console.error("FAIL\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}

console.log("PASS P0-36/02/06 catalog: students exists, FORCE on, GiST present");
