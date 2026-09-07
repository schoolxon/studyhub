import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = value;
  }
}

export const rootDir = root;

function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  const secretFile = path.join(root, "server", ".jwt-secret");
  if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, "utf8").trim();
  const generated = crypto.randomBytes(32).toString("hex");
  fs.writeFileSync(secretFile, generated, { encoding: "utf8" });
  return generated;
}

export const env = {
  pgHost: process.env.PGHOST || "127.0.0.1",
  pgPort: Number(process.env.PGPORT || 5432),
  pgUser: process.env.PGUSER || "postgres",
  pgPassword: process.env.PGPASSWORD || "",
  pgDatabase: process.env.PGDATABASE || "studyhub",
  pgAppUser: process.env.PGAPPUSER || "studyhub_app",
  pgAppPassword: process.env.PGAPPPASSWORD || "studyhub_app_local",
  jwtSecret: jwtSecret(),
  apiPort: Number(process.env.API_PORT || 8787),
  demoPassword: process.env.DEMO_OWNER_PASSWORD || "demo1234",
};
