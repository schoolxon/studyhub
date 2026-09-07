import { execFileSync, spawn } from "node:child_process";

export const psqlBin =
  process.env.PSQL_PATH ||
  "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe";

export function requireDb() {
  if (!process.env.PGDATABASE) {
    console.error("PGDATABASE is required");
    process.exit(2);
  }
}

export function psqlArgs(extra) {
  return [
    "-h",
    process.env.PGHOST || "127.0.0.1",
    "-p",
    process.env.PGPORT || "5432",
    "-U",
    process.env.PGUSER || "postgres",
    "-d",
    process.env.PGDATABASE,
    ...extra,
  ];
}

export function query(sql) {
  const raw = execFileSync(psqlBin, psqlArgs(["-At", "-v", "ON_ERROR_STOP=1", "-c", sql]), {
    encoding: "utf8",
    env: process.env,
  }).trim();
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const skip = /^(SET|BEGIN|COMMIT|ROLLBACK|INSERT 0 \d+|UPDATE \d+|CREATE |ALTER |DROP |GRANT |DO|NOTICE:)/i;
  const useful = lines.filter((l) => !skip.test(l));
  const uuid = useful.find((l) => /^[0-9a-f-]{36}$/i.test(l));
  if (uuid) return uuid;
  return useful[useful.length - 1] || lines[lines.length - 1] || "";
}

export function queryOkOrError(sql) {
  try {
    execFileSync(psqlBin, psqlArgs(["-At", "-v", "ON_ERROR_STOP=1", "-c", sql]), {
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

export function spawnSql(sql) {
  return new Promise((resolve) => {
    const child = spawn(psqlBin, psqlArgs(["-v", "ON_ERROR_STOP=1", "-c", sql]), {
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      stderr += d;
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}
