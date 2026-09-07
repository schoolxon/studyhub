import { execFileSync } from "node:child_process";
import { psqlArgs, psqlBin, requireDb } from "./_pg.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

requireDb();
const sqlFile = path.join(path.dirname(fileURLToPath(import.meta.url)), "p0-01-set-local.sql");
const raw = execFileSync(psqlBin, psqlArgs(["-At", "-f", sqlFile]), {
  encoding: "utf8",
  env: process.env,
});
const lines = raw
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !/^(SET|BEGIN|COMMIT)/.test(l));

const failures = [];
const localOutside = lines[1] ?? lines[0];
if (localOutside === "00000000-0000-0000-0000-000000000001") {
  failures.push("SET LOCAL persisted outside a transaction (pool hazard if app does this)");
}
if (!raw.includes("00000000-0000-0000-0000-00000000000a")) {
  failures.push("SET LOCAL inside BEGIN did not apply");
}
if (!raw.includes("00000000-0000-0000-0000-00000000000b")) {
  failures.push("session SET (is_local=false) should stick — that is the leak mode");
}

if (failures.length) {
  console.error("FAIL P0-01\n" + failures.map((f) => ` - ${f}`).join("\n"));
  console.error("output:\n" + raw);
  process.exit(1);
}
console.log("PASS P0-01 SET LOCAL dies at autocommit; session SET leaks (do not use)");
