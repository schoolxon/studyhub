import { allocateFifo } from "../AUDIT/lib/money.js";
import { indianFy, nextCounter, pad, payMode } from "./db.js";

function todayIso() {
  const now = new Date();
  const tz = now.toLocaleString("en-CA", { timeZone: "Asia/Kolkata", hour12: false });
  return tz.slice(0, 10);
}

function addMonths(iso, months) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  const originalDay = cursor.getDate();
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor.getDate() !== originalDay) cursor.setDate(0);
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, "0");
  const d = String(cursor.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  cursor.setDate(cursor.getDate() + days);
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, "0");
  const d = String(cursor.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

async function branchCode(client, branchId) {
  const { rows } = await client.query(`SELECT code FROM branches WHERE id = $1`, [branchId]);
  return rows[0]?.code || "MAIN";
}

async function invoiceNo(client, ctx) {
  const fy = indianFy(todayIso());
  const n = await nextCounter(client, { ...ctx, type: "invoice", fy });
  const code = await branchCode(client, ctx.branchId);
  return `INV/${fy}/${code}/${pad(n)}`;
}

async function receiptNo(client, ctx) {
  const fy = indianFy(todayIso());
  const n = await nextCounter(client, { ...ctx, type: "receipt", fy });
  const code = await branchCode(client, ctx.branchId);
  return `RCP/${fy}/${code}/${pad(n)}`;
}

async function studentCode(client, ctx) {
  const fy = indianFy(todayIso());
  const n = await nextCounter(client, { ...ctx, type: "student", fy });
  return `ST-${pad(n)}`;
}

async function applyFifo(client, { tenantId, studentId, amountPaise, userId, branchId, mode }) {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw Object.assign(new Error("Amount must be a whole rupee in paise"), { statusCode: 400 });
  }
  if (amountPaise === 0) return { applied: 0, advancePaise: 0 };

  const open = (
    await client.query(
      `SELECT id, total_amount, paid_amount, status
       FROM invoices
       WHERE student_id = $1 AND status IN ('unpaid','partial') AND deleted_at IS NULL
       ORDER BY invoice_date ASC, id ASC`,
      [studentId]
    )
  ).rows.map((row) => ({
    id: row.id,
    total_amount: Number(row.total_amount),
    paid_amount: Number(row.paid_amount),
    status: row.status,
  }));

  const result = allocateFifo(open, amountPaise);
  const applied = amountPaise - result.advancePaise;
  let firstInvoiceId = null;

  for (const inv of result.invoices) {
    if (inv.paid_amount === open.find((o) => o.id === inv.id).paid_amount) continue;
    if (!firstInvoiceId) firstInvoiceId = inv.id;
    await client.query(
      `UPDATE invoices SET paid_amount = $2, status = $3 WHERE id = $1`,
      [inv.id, inv.paid_amount, inv.status === "open" ? "unpaid" : inv.status]
    );
  }

  if (applied > 0) {
    const number = await receiptNo(client, { tenantId, branchId });
    await client.query(
      `INSERT INTO payments (
         tenant_id, branch_id, student_id, invoice_id, receipt_no, amount, mode, collected_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [tenantId, branchId, studentId, firstInvoiceId, number, applied, payMode(mode), userId]
    );
  }

  if (result.advancePaise > 0) {
    const { rows } = await client.query(
      `INSERT INTO payments (
         tenant_id, branch_id, student_id, invoice_id, receipt_no, amount, mode, collected_by, note
       ) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,'advance') RETURNING id`,
      [
        tenantId,
        branchId,
        studentId,
        await receiptNo(client, { tenantId, branchId }),
        result.advancePaise,
        payMode(mode),
        userId,
      ]
    );
    await client.query(
      `INSERT INTO student_advances (tenant_id, student_id, amount, source_payment_id, note)
       VALUES ($1,$2,$3,$4,'FIFO leftover')`,
      [tenantId, studentId, result.advancePaise, rows[0].id]
    );
  }

  return { applied, advancePaise: result.advancePaise };
}

export async function admitStudent(client, ctx, body) {
  const name = String(body.name || "").trim();
  const mobile = String(body.mobile || "").trim();
  if (!name || !mobile) throw Object.assign(new Error("Name and mobile are required"), { statusCode: 400 });

  const plan = (
    await client.query(`SELECT * FROM fee_plans WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [
      body.planId,
      ctx.tenantId,
    ])
  ).rows[0];
  if (!plan) throw Object.assign(new Error("Unknown plan"), { statusCode: 400 });

  const shift = (
    await client.query(`SELECT * FROM shifts WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [
      body.shiftId,
      ctx.tenantId,
    ])
  ).rows[0];
  if (!shift) throw Object.assign(new Error("Unknown shift"), { statusCode: 400 });

  const seat = (
    await client.query(
      `SELECT * FROM seats WHERE branch_id = $1 AND seat_no = $2 AND deleted_at IS NULL`,
      [ctx.branchId, body.seatNo]
    )
  ).rows[0];
  if (!seat) throw Object.assign(new Error("Unknown seat"), { statusCode: 400 });

  const startDate = body.startDate || todayIso();
  const months = plan.duration_months || 1;
  const endDate = addMonths(startDate, months);
  const discountPaise = Number.parseInt(body.discountPaise || "0", 10) || 0;
  const payingNow = Number.parseInt(body.payingNow || "0", 10) || 0;
  const registration = Number(plan.registration_fee);
  const deposit = Number(plan.security_deposit);
  const base = Number(plan.amount);
  const totalPaise = base + registration + deposit - discountPaise;
  if (totalPaise < 0) throw Object.assign(new Error("Discount larger than bill"), { statusCode: 400 });

  const code = await studentCode(client, ctx);
  const student = (
    await client.query(
      `INSERT INTO students (
         tenant_id, branch_id, student_code, name, mobile, guardian_mobile, created_by, qr_token
       ) VALUES ($1,$2,$3,$4,$5,$6,$7, encode(gen_random_bytes(16),'hex'))
       RETURNING id`,
      [ctx.tenantId, ctx.branchId, code, name, mobile, String(body.guardian || "").trim() || null, ctx.userId]
    )
  ).rows[0];

  const membership = (
    await client.query(
      `INSERT INTO memberships (
         tenant_id, branch_id, student_id, fee_plan_id, shift_id, seat_id,
         start_date, end_date, original_end_date, base_amount, discount_amount,
         registration_fee, security_deposit, total_amount, status, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$7,$9,$10,$11,$12,$13,'active',$14)
       RETURNING id`,
      [
        ctx.tenantId,
        ctx.branchId,
        student.id,
        plan.id,
        shift.id,
        seat.id,
        startDate,
        endDate,
        base,
        discountPaise,
        registration,
        deposit,
        totalPaise,
        ctx.userId,
      ]
    )
  ).rows[0];

  await client.query(
    `INSERT INTO seat_allocations (
       tenant_id, seat_id, shift_id, membership_id, student_id, period
     ) VALUES ($1,$2,$3,$4,$5, daterange($6::date, ($7::date + 1), '[)'))`,
    [ctx.tenantId, seat.id, shift.id, membership.id, student.id, startDate, endDate]
  );

  const number = await invoiceNo(client, ctx);
  const invoice = (
    await client.query(
      `INSERT INTO invoices (
         tenant_id, branch_id, student_id, membership_id, invoice_no, invoice_date, due_date,
         subtotal, discount_amount, total_amount, paid_amount, status, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8,$9,0,'unpaid',$10)
       RETURNING id`,
      [
        ctx.tenantId,
        ctx.branchId,
        student.id,
        membership.id,
        number,
        startDate,
        base + registration + deposit,
        discountPaise,
        totalPaise,
        ctx.userId,
      ]
    )
  ).rows[0];

  const items = [
    ["membership", plan.name, base],
    ["registration", "Registration", registration],
    ["deposit", "Security deposit", deposit],
  ].filter((item) => item[2] > 0);

  for (const [type, description, amount] of items) {
    await client.query(
      `INSERT INTO invoice_items (tenant_id, invoice_id, item_type, description, unit_amount, total_amount)
       VALUES ($1,$2,$3,$4,$5,$5)`,
      [ctx.tenantId, invoice.id, type, description, amount]
    );
  }

  if (deposit > 0) {
    await client.query(
      `INSERT INTO deposits (tenant_id, student_id, amount, type, created_by)
       VALUES ($1,$2,$3,'collected',$4)`,
      [ctx.tenantId, student.id, deposit, ctx.userId]
    );
  }

  if (payingNow > 0) {
    await applyFifo(client, {
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      studentId: student.id,
      amountPaise: payingNow,
      userId: ctx.userId,
      mode: body.mode,
    });
  }

  return { studentId: student.id, membershipId: membership.id, invoiceId: invoice.id, endDate, seatNo: seat.seat_no };
}

export async function collectPayment(client, ctx, body) {
  const amountPaise = Number.parseInt(body.amountPaise, 10);
  return applyFifo(client, {
    tenantId: ctx.tenantId,
    branchId: ctx.branchId,
    studentId: body.studentId,
    amountPaise,
    userId: ctx.userId,
    mode: body.mode,
  });
}

export async function renewMembership(client, ctx, body) {
  const mem = (
    await client.query(`SELECT * FROM memberships WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [
      body.membershipId,
      ctx.tenantId,
    ])
  ).rows[0];
  if (!mem) throw Object.assign(new Error("Membership not found"), { statusCode: 404 });

  const plan = (
    await client.query(`SELECT * FROM fee_plans WHERE id = $1 AND tenant_id = $2`, [body.planId || mem.fee_plan_id, ctx.tenantId])
  ).rows[0];
  if (!plan) throw Object.assign(new Error("Unknown plan"), { statusCode: 400 });

  const today = todayIso();
  const from = isoCmp(isoDate(mem.end_date), today) >= 0 ? addDays(isoDate(mem.end_date), 1) : today;
  const endDate = addMonths(from, plan.duration_months || 1);
  const totalPaise = Number(plan.amount);

  await client.query(`UPDATE memberships SET status = 'superseded', updated_at = now() WHERE id = $1`, [mem.id]);

  const next = (
    await client.query(
      `INSERT INTO memberships (
         tenant_id, branch_id, student_id, fee_plan_id, shift_id, seat_id,
         start_date, end_date, original_end_date, base_amount, discount_amount,
         registration_fee, security_deposit, total_amount, status, is_renewal,
         previous_membership_id, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$7,$9,0,0,0,$9,'active',TRUE,$10,$11)
       RETURNING id`,
      [
        ctx.tenantId,
        ctx.branchId,
        mem.student_id,
        plan.id,
        mem.shift_id,
        mem.seat_id,
        from,
        endDate,
        totalPaise,
        mem.id,
        ctx.userId,
      ]
    )
  ).rows[0];

  if (mem.seat_id) {
    await client.query(
      `UPDATE seat_allocations SET released_at = now()
       WHERE membership_id = $1 AND released_at IS NULL`,
      [mem.id]
    );
    await client.query(
      `INSERT INTO seat_allocations (
         tenant_id, seat_id, shift_id, membership_id, student_id, period
       ) VALUES ($1,$2,$3,$4,$5, daterange($6::date, ($7::date + 1), '[)'))`,
      [ctx.tenantId, mem.seat_id, mem.shift_id, next.id, mem.student_id, from, endDate]
    );
  }

  const number = await invoiceNo(client, ctx);
  await client.query(
    `INSERT INTO invoices (
       tenant_id, branch_id, student_id, membership_id, invoice_no, invoice_date, due_date,
       subtotal, total_amount, paid_amount, status, created_by
     ) VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$7,0,'unpaid',$8)`,
    [ctx.tenantId, ctx.branchId, mem.student_id, next.id, number, today, totalPaise, ctx.userId]
  );

  const payingNow = Number.parseInt(body.payingNow ?? String(totalPaise), 10) || 0;
  if (payingNow > 0) {
    await applyFifo(client, {
      tenantId: ctx.tenantId,
      branchId: ctx.branchId,
      studentId: mem.student_id,
      amountPaise: payingNow,
      userId: ctx.userId,
      mode: body.mode,
    });
  }

  return { membershipId: next.id, endDate };
}

function isoDate(value) {
  if (!value) return todayIso();
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

function isoCmp(a, b) {
  return a === b ? 0 : a > b ? 1 : -1;
}

export async function togglePause(client, ctx, studentId) {
  const mem = (
    await client.query(
      `SELECT * FROM memberships
       WHERE student_id = $1 AND tenant_id = $2 AND deleted_at IS NULL
         AND status IN ('active','paused')
       ORDER BY end_date DESC LIMIT 1`,
      [studentId, ctx.tenantId]
    )
  ).rows[0];
  if (!mem) throw Object.assign(new Error("No live membership"), { statusCode: 400 });

  if (mem.status === "paused") {
    await client.query(`UPDATE memberships SET status = 'active', paused_from = NULL, updated_at = now() WHERE id = $1`, [
      mem.id,
    ]);
    await client.query(
      `UPDATE membership_pauses SET resumed_on = CURRENT_DATE, days = CURRENT_DATE - paused_from
       WHERE membership_id = $1 AND resumed_on IS NULL`,
      [mem.id]
    );
    await client.query(`UPDATE students SET status = 'active' WHERE id = $1`, [studentId]);
    return { paused: false };
  }

  await client.query(
    `UPDATE memberships SET status = 'paused', paused_from = CURRENT_DATE, updated_at = now() WHERE id = $1`,
    [mem.id]
  );
  await client.query(
    `INSERT INTO membership_pauses (tenant_id, membership_id, paused_from, hold_charge_paise)
     VALUES ($1,$2,CURRENT_DATE,0)`,
    [ctx.tenantId, mem.id]
  );
  await client.query(`UPDATE students SET status = 'paused' WHERE id = $1`, [studentId]);
  return { paused: true };
}

export async function checkIn(client, ctx, studentId) {
  const student = (
    await client.query(`SELECT id, branch_id FROM students WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`, [
      studentId,
      ctx.tenantId,
    ])
  ).rows[0];
  if (!student) throw Object.assign(new Error("Student not found"), { statusCode: 404 });

  await client.query(
    `INSERT INTO attendance (tenant_id, branch_id, student_id, attendance_date, check_in, method, marked_by)
     VALUES ($1,$2,$3, (now() AT TIME ZONE 'Asia/Kolkata')::date, now(), 'manual', $4)`,
    [ctx.tenantId, student.branch_id, studentId, ctx.userId]
  );
}

export async function checkOut(client, ctx, studentId) {
  const { rowCount } = await client.query(
    `UPDATE attendance
     SET check_out = now(),
         duration_minutes = GREATEST(1, ROUND(EXTRACT(EPOCH FROM (now() - check_in)) / 60.0)::int)
     WHERE student_id = $1 AND check_out IS NULL`,
    [studentId]
  );
  if (!rowCount) throw Object.assign(new Error("No open session"), { statusCode: 400 });
}

export async function updateSettings(client, ctx, body) {
  const libraryName = String(body.libraryName || "").trim();
  const branchName = String(body.branchName || "").trim();
  const language = body.language === "hi" ? "hi" : "en";
  const graceDays = Number.parseInt(body.graceDays, 10);
  if (libraryName) {
    await client.query(`UPDATE tenants SET name = $2, language = $3, updated_at = now() WHERE id = $1`, [
      ctx.tenantId,
      libraryName,
      language,
    ]);
  }
  if (branchName) {
    await client.query(`UPDATE branches SET name = $2 WHERE id = $1`, [ctx.branchId, branchName]);
  }
  if (Number.isInteger(graceDays)) {
    await client.query(
      `UPDATE tenants SET settings = COALESCE(settings,'{}'::jsonb) || jsonb_build_object('grace_days', $2::int)
       WHERE id = $1`,
      [ctx.tenantId, graceDays]
    );
  }
}
