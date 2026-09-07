import pg from "pg";
import { env } from "./env.js";

const base = {
  host: env.pgHost,
  port: env.pgPort,
  password: env.pgPassword,
  max: 10,
};

export const adminPool = new pg.Pool({
  ...base,
  user: env.pgUser,
  database: env.pgDatabase,
});

export const appPool = new pg.Pool({
  ...base,
  user: env.pgAppUser,
  password: env.pgAppPassword || env.pgPassword,
  database: env.pgDatabase,
});

export async function withAdmin(fn) {
  const client = await adminPool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
}

export async function withTenant(tenantId, fn) {
  const client = await appPool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config($1, $2, true)", ["app.tenant_id", tenantId]);
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
}

export function indianFy(iso = new Date().toISOString().slice(0, 10)) {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  const start = month >= 4 ? year : year - 1;
  return `${String(start).slice(-2)}${String(start + 1).slice(-2)}`;
}

export async function nextCounter(client, { tenantId, branchId, type, fy }) {
  const { rows } = await client.query(
    `INSERT INTO counters (tenant_id, branch_id, type, fy, last_no)
     VALUES ($1,$2,$3,$4,1)
     ON CONFLICT (tenant_id, branch_id, type, fy)
     DO UPDATE SET last_no = counters.last_no + 1
     RETURNING last_no`,
    [tenantId, branchId, type, fy]
  );
  return rows[0].last_no;
}

export function pad(n, width = 4) {
  return String(n).padStart(width, "0");
}

export function shiftCode(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

export function payMode(label) {
  const key = String(label || "cash").toLowerCase();
  if (key === "upi") return "upi";
  if (key === "card") return "card";
  if (key === "bank") return "bank";
  if (key === "online") return "online";
  return "cash";
}
