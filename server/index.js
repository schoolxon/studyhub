import Fastify from "fastify";
import cors from "@fastify/cors";
import bcrypt from "bcryptjs";
import { env } from "./env.js";
import { adminPool, withAdmin, withTenant } from "./db.js";
import { readAuth, signUser } from "./auth-token.js";
import { loadState } from "./snapshot.js";
import {
  admitStudent,
  checkIn,
  checkOut,
  collectPayment,
  renewMembership,
  togglePause,
  updateSettings,
} from "./commands.js";
import { ensureDatabase } from "./setup.js";

function httpError(error, reply) {
  const code = error.statusCode || (error.code === "23P01" || error.code === "23505" ? 409 : 500);
  const message =
    error.code === "23P01"
      ? "That seat is already held for this shift."
      : error.code === "23505"
        ? "That record already exists (open attendance session or duplicate number)."
        : error.message || "Server error";
  reply.code(code).send({ error: message });
}

async function tenantState(auth) {
  return withTenant(auth.tid, (client) => loadState(client, { tenantId: auth.tid, branchId: auth.bid }));
}

async function buildApp() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true }));

  app.post("/v1/auth/login", async (request, reply) => {
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    if (!email || !password) return reply.code(400).send({ error: "Email and password are required" });
    const { rows } = await adminPool.query(
      `SELECT * FROM users
       WHERE lower(email) = $1 AND deleted_at IS NULL AND is_active
       LIMIT 1`,
      [email]
    );
    const user = rows[0];
    if (!user?.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }
    if (!user.branch_id) {
      const branch = await adminPool.query(
        `SELECT id FROM branches WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at LIMIT 1`,
        [user.tenant_id]
      );
      user.branch_id = branch.rows[0]?.id;
    }
    await adminPool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [user.id]);
    const token = signUser(user);
    const state = await withTenant(user.tenant_id, (client) =>
      loadState(client, { tenantId: user.tenant_id, branchId: user.branch_id })
    );
    return { token, state };
  });

  app.post("/v1/auth/signup", async (request, reply) => {
    const libraryName = String(request.body?.libraryName || "").trim();
    const email = String(request.body?.email || "").trim().toLowerCase();
    const password = String(request.body?.password || "");
    const mobile = String(request.body?.mobile || "9000000000").trim();
    if (!libraryName || !email || !password) {
      return reply.code(400).send({ error: "Library name, email, and password are required" });
    }
    try {
      const user = await withAdmin(async (client) => {
        const taken = await client.query(`SELECT 1 FROM users WHERE lower(email) = $1 AND deleted_at IS NULL`, [email]);
        if (taken.rowCount) throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
        const slug = libraryName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")
          .slice(0, 40) || "library";
        const tenant = (
          await client.query(
            `INSERT INTO tenants (name, slug, owner_name, owner_mobile, owner_email, status)
             VALUES ($1,$2,$3,$4,$5,'trial') RETURNING id`,
            [libraryName, `${slug}-${Date.now().toString(36)}`, libraryName, mobile, email]
          )
        ).rows[0];
        const branch = (
          await client.query(
            `INSERT INTO branches (tenant_id, name, code) VALUES ($1,'Main','MAIN') RETURNING id`,
            [tenant.id]
          )
        ).rows[0];
        const hash = bcrypt.hashSync(password, 10);
        const created = (
          await client.query(
            `INSERT INTO users (tenant_id, branch_id, name, mobile, email, password_hash, role)
             VALUES ($1,$2,$3,$4,$5,$6,'owner') RETURNING *`,
            [tenant.id, branch.id, libraryName, mobile, email, hash]
          )
        ).rows[0];
        const shifts = [
          ["Morning", "06:00", "12:00", false, 1],
          ["Noon", "12:00", "18:00", false, 2],
          ["Evening", "18:00", "23:00", false, 3],
          ["Full Day", "06:00", "23:00", true, 4],
        ];
        for (const [name, start, end, full, sort] of shifts) {
          await client.query(
            `INSERT INTO shifts (tenant_id, branch_id, name, start_time, end_time, is_full_day, sort_order)
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [tenant.id, branch.id, name, start, end, full, sort]
          );
        }
        const plans = [
          ["1 Month", 1, 80_000],
          ["3 Months", 3, 220_000],
          ["6 Months", 6, 400_000],
        ];
        for (const [name, months, amount] of plans) {
          await client.query(
            `INSERT INTO fee_plans (tenant_id, branch_id, name, duration_months, amount, registration_fee, security_deposit)
             VALUES ($1,$2,$3,$4,$5,10000,50000)`,
            [tenant.id, branch.id, name, months, amount]
          );
        }
        const letters = ["A", "B", "C", "D", "E", "F"];
        for (let r = 0; r < letters.length; r += 1) {
          for (let c = 1; c <= 10; c += 1) {
            await client.query(
              `INSERT INTO seats (tenant_id, branch_id, seat_no, row_pos, col_pos)
               VALUES ($1,$2,$3,$4,$5)`,
              [tenant.id, branch.id, `${letters[r]}-${String(c).padStart(2, "0")}`, r + 1, c]
            );
          }
        }
        created.branch_id = branch.id;
        created.tenant_id = tenant.id;
        return created;
      });
      const token = signUser(user);
      const state = await withTenant(user.tenant_id, (client) =>
        loadState(client, { tenantId: user.tenant_id, branchId: user.branch_id })
      );
      return { token, state };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.addHook("preHandler", async (request, reply) => {
    const url = request.url.split("?")[0];
    if (url === "/health" || url.startsWith("/v1/auth/")) return;
    if (!url.startsWith("/v1/")) return;
    try {
      request.auth = readAuth(request);
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.get("/v1/state", async (request, reply) => {
    try {
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/admissions", async (request, reply) => {
    try {
      const created = await withTenant(request.auth.tid, (client) =>
        admitStudent(
          client,
          { tenantId: request.auth.tid, branchId: request.auth.bid, userId: request.auth.sub },
          request.body || {}
        )
      );
      return { created, state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/payments", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) =>
        collectPayment(
          client,
          { tenantId: request.auth.tid, branchId: request.auth.bid, userId: request.auth.sub },
          request.body || {}
        )
      );
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/memberships/renew", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) =>
        renewMembership(
          client,
          { tenantId: request.auth.tid, branchId: request.auth.bid, userId: request.auth.sub },
          request.body || {}
        )
      );
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/students/:id/pause", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) => togglePause(client, { tenantId: request.auth.tid }, request.params.id));
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/attendance/check-in", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) =>
        checkIn(client, { tenantId: request.auth.tid, userId: request.auth.sub }, request.body.studentId)
      );
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.post("/v1/attendance/check-out", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) => checkOut(client, { tenantId: request.auth.tid }, request.body.studentId));
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  app.patch("/v1/settings", async (request, reply) => {
    try {
      await withTenant(request.auth.tid, (client) =>
        updateSettings(
          client,
          { tenantId: request.auth.tid, branchId: request.auth.bid },
          request.body || {}
        )
      );
      return { state: await tenantState(request.auth) };
    } catch (error) {
      return httpError(error, reply);
    }
  });

  return app;
}

await ensureDatabase();
const app = await buildApp();
await app.listen({ port: env.apiPort, host: "127.0.0.1" });
