import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import bcrypt from "bcryptjs";
import pg from "pg";
import { env, rootDir } from "./env.js";

function findPsql() {
  const named = process.env.PSQL_PATH;
  if (named && fs.existsSync(named)) return named;
  const candidates = [
    "C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
    "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
  ];
  return candidates.find((file) => fs.existsSync(file)) || "psql";
}

function runPsql(database, file) {
  const result = spawnSync(
    findPsql(),
    ["-h", env.pgHost, "-p", String(env.pgPort), "-U", env.pgUser, "-d", database, "-v", "ON_ERROR_STOP=1", "-f", file],
    { env: { ...process.env, PGPASSWORD: env.pgPassword }, encoding: "utf8" }
  );
  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `psql failed on ${file}`);
  }
}

function addMonths(iso, months) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  const original = cursor.getDate();
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor.getDate() !== original) cursor.setDate(0);
  return cursor.toISOString().slice(0, 10);
}

function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  cursor.setDate(cursor.getDate() + days);
  return cursor.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 10);
}

export async function ensureDatabase() {
  const bootstrap = new pg.Client({
    host: env.pgHost,
    port: env.pgPort,
    user: env.pgUser,
    password: env.pgPassword,
    database: "postgres",
  });
  await bootstrap.connect();
  try {
    const { rows } = await bootstrap.query("SELECT 1 FROM pg_database WHERE datname = $1", [env.pgDatabase]);
    if (rows.length === 0) {
      await bootstrap.query(`CREATE DATABASE ${env.pgDatabase}`);
    }
  } finally {
    await bootstrap.end();
  }

  const admin = new pg.Client({
    host: env.pgHost,
    port: env.pgPort,
    user: env.pgUser,
    password: env.pgPassword,
    database: env.pgDatabase,
  });
  await admin.connect();
  try {
    const { rows } = await admin.query("SELECT to_regclass('public.tenants') AS t");
    if (!rows[0].t) {
      runPsql(env.pgDatabase, path.join(rootDir, "studyhub-plan", "05-Database-Schema.sql"));
      runPsql(env.pgDatabase, path.join(rootDir, "AUDIT", "migrations", "0003_p1_objects.sql"));
    }

    if (env.pgAppPassword) {
      await admin.query(`ALTER ROLE studyhub_app LOGIN PASSWORD '${env.pgAppPassword.replace(/'/g, "''")}'`);
    }
    await admin.query(`GRANT CONNECT ON DATABASE ${env.pgDatabase} TO studyhub_app`);
    await admin.query(`GRANT USAGE ON SCHEMA public TO studyhub_app`);
    await admin.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO studyhub_app`
    );
    await admin.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO studyhub_app`);
    await admin.query(`GRANT SELECT ON ALL TABLES IN SCHEMA public TO studyhub_app`);

    await seedDemo(admin);
  } finally {
    await admin.end();
  }
}

async function seedDemo(client) {
  const existing = await client.query(`SELECT id FROM tenants WHERE slug = 'aarav' AND deleted_at IS NULL`);
  if (existing.rows.length) return;

  const today = todayIso();
  const hash = bcrypt.hashSync(env.demoPassword, 10);
  const tenantId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  await client.query(
    `INSERT INTO tenants (id, name, slug, owner_name, owner_mobile, owner_email, city, status, settings)
     VALUES ($1,'Aarav Study Hall','aarav','Aarav','9999999999','owner@aarav.test','Delhi','trial', '{"grace_days":3}'::jsonb)`,
    [tenantId]
  );
  await client.query(
    `INSERT INTO branches (id, tenant_id, name, code, city, is_active)
     VALUES ($1,$2,'Main','MAIN','Delhi', TRUE)`,
    [branchId, tenantId]
  );
  await client.query(
    `INSERT INTO users (id, tenant_id, branch_id, name, mobile, email, password_hash, role, is_active)
     VALUES ($1,$2,$3,'Aarav Owner','9999999999','owner@aarav.test',$4,'owner', TRUE)`,
    [userId, tenantId, branchId, hash]
  );

  const shiftRows = [
    ["Morning", "06:00", "12:00", false, 1],
    ["Noon", "12:00", "18:00", false, 2],
    ["Evening", "18:00", "23:00", false, 3],
    ["Full Day", "06:00", "23:00", true, 4],
  ];
  const shiftIds = {};
  for (const [name, start, end, full, sort] of shiftRows) {
    const { rows } = await client.query(
      `INSERT INTO shifts (tenant_id, branch_id, name, start_time, end_time, is_full_day, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [tenantId, branchId, name, start, end, full, sort]
    );
    shiftIds[name] = rows[0].id;
  }

  const planSpecs = [
    ["1 Month", 1, 80_000],
    ["3 Months", 3, 220_000],
    ["6 Months", 6, 400_000],
  ];
  const planIds = {};
  for (const [name, months, amount] of planSpecs) {
    const { rows } = await client.query(
      `INSERT INTO fee_plans (tenant_id, branch_id, name, duration_months, amount, registration_fee, security_deposit)
       VALUES ($1,$2,$3,$4,$5,10000,50000) RETURNING id`,
      [tenantId, branchId, name, months, amount]
    );
    planIds[name] = rows[0].id;
  }

  const seatIds = {};
  const rows = ["A", "B", "C", "D", "E", "F"];
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 1; c <= 10; c += 1) {
      const no = `${rows[r]}-${String(c).padStart(2, "0")}`;
      const inserted = await client.query(
        `INSERT INTO seats (tenant_id, branch_id, seat_no, row_pos, col_pos)
         VALUES ($1,$2,$3,$4,$5) RETURNING id`,
        [tenantId, branchId, no, r + 1, c]
      );
      seatIds[no] = inserted.rows[0].id;
    }
  }

  const people = [
    ["Riya Sharma", "9876500001", "A-01", "Morning", "1 Month", addMonths(today, -1), addDays(today, 1), "active", 80_000, 80_000],
    ["Aman Gupta", "9876500002", "B-04", "Morning", "1 Month", addMonths(today, -1), addDays(today, 3), "active", 80_000, 80_000],
    ["Neha Verma", "9876500003", "C-08", "Morning", "1 Month", addMonths(today, -1), addDays(today, -3), "active", 80_000, 0],
    ["Kabir Singh", "9876500004", "D-02", "Evening", "3 Months", addMonths(today, -1), addMonths(today, 2), "active", 220_000, 220_000],
    ["Sana Ali", "9876500005", "A-05", "Noon", "1 Month", addMonths(today, -1), addDays(today, 20), "paused", 80_000, 80_000],
    ["Rohan Mehta", "9876500006", "E-07", "Morning", "1 Month", addMonths(today, -1), addDays(today, 12), "active", 80_000, 40_000],
    ["Ishita Rao", "9876500007", "F-01", "Full Day", "6 Months", addMonths(today, -2), addMonths(today, 4), "active", 400_000, 400_000],
    ["Vivek Patel", "9876500008", "B-09", "Morning", "1 Month", addMonths(today, -1), addDays(today, -10), "active", 80_000, 0],
    ["Meera Joshi", "9876500009", "C-03", "Evening", "1 Month", addMonths(today, -1), addDays(today, 7), "active", 80_000, 80_000],
    ["Arjun Nair", "9876500010", "D-10", "Morning", "3 Months", addMonths(today, -2), addMonths(today, 1), "active", 220_000, 220_000],
  ];

  let n = 0;
  for (const [name, mobile, seatNo, shiftName, planName, start, end, status, total, paid] of people) {
    n += 1;
    const studentId = crypto.randomUUID();
    const memId = crypto.randomUUID();
    const invId = crypto.randomUUID();
    const studentStatus = status === "paused" ? "paused" : "active";
    await client.query(
      `INSERT INTO students (id, tenant_id, branch_id, student_code, name, mobile, guardian_mobile, status, qr_token, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, encode(gen_random_bytes(16),'hex'), $9)`,
      [studentId, tenantId, branchId, `ST-${String(n).padStart(4, "0")}`, name, mobile, `98111${mobile.slice(-5)}`, studentStatus, userId]
    );
    await client.query(
      `INSERT INTO memberships (
         id, tenant_id, branch_id, student_id, fee_plan_id, shift_id, seat_id,
         start_date, end_date, original_end_date, base_amount, total_amount, status, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$8,$10,$10,$11,$12)`,
      [
        memId,
        tenantId,
        branchId,
        studentId,
        planIds[planName],
        shiftIds[shiftName],
        seatIds[seatNo],
        start,
        end,
        total,
        status,
        userId,
      ]
    );
    await client.query(
      `INSERT INTO seat_allocations (tenant_id, seat_id, shift_id, membership_id, student_id, period)
       VALUES ($1,$2,$3,$4,$5, daterange($6::date, ($7::date + 1), '[)'))`,
      [tenantId, seatIds[seatNo], shiftIds[shiftName], memId, studentId, start, end]
    );
    const invStatus = paid >= total ? "paid" : paid > 0 ? "partial" : "unpaid";
    await client.query(
      `INSERT INTO invoices (
         id, tenant_id, branch_id, student_id, membership_id, invoice_no, invoice_date, due_date,
         subtotal, total_amount, paid_amount, status, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$7,$8,$8,$9,$10,$11)`,
      [invId, tenantId, branchId, studentId, memId, `INV/2627/MAIN/${String(n).padStart(4, "0")}`, start, total, paid, invStatus, userId]
    );
    if (paid > 0) {
      await client.query(
        `INSERT INTO payments (tenant_id, branch_id, student_id, invoice_id, receipt_no, amount, mode, collected_by, paid_at)
         VALUES ($1,$2,$3,$4,$5,$6,'upi',$7, now())`,
        [tenantId, branchId, studentId, invId, `RCP/2627/MAIN/${String(n).padStart(4, "0")}`, paid, userId]
      );
    }
  }

  await client.query(
    `INSERT INTO counters (tenant_id, branch_id, type, fy, last_no) VALUES
     ($1,$2,'invoice','2627',10), ($1,$2,'receipt','2627',10), ($1,$2,'student','2627',10)
     ON CONFLICT (tenant_id, branch_id, type, fy) DO NOTHING`,
    [tenantId, branchId]
  );

  await client.query(
    `INSERT INTO attendance (tenant_id, branch_id, student_id, attendance_date, check_in, method, marked_by)
     SELECT $1,$2, s.id, CURRENT_DATE, now() - interval '90 minutes', 'manual', $3
     FROM students s WHERE s.mobile IN ('9876500010','9876500001')`,
    [tenantId, branchId, userId]
  );
}
