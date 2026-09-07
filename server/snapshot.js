import { shiftCode } from "./db.js";

function hours(start, end) {
  return `${String(start).slice(0, 5)}–${String(end).slice(0, 5)}`;
}

function isoDate(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

export async function loadState(client, { tenantId, branchId }) {
  const tenant = (
    await client.query(
      `SELECT t.name, t.language, t.settings, b.name AS branch_name, b.code AS branch_code
       FROM tenants t
       JOIN branches b ON b.tenant_id = t.id AND b.id = $2
       WHERE t.id = $1`,
      [tenantId, branchId]
    )
  ).rows[0];

  const shifts = (
    await client.query(
      `SELECT id, name, start_time, end_time, is_full_day, sort_order
       FROM shifts WHERE branch_id = $1 AND deleted_at IS NULL AND is_active
       ORDER BY sort_order, name`,
      [branchId]
    )
  ).rows.map((row) => ({
    id: row.id,
    code: shiftCode(row.name),
    name: row.name,
    hours: hours(row.start_time, row.end_time),
    fullDay: row.is_full_day,
  }));

  const plans = (
    await client.query(
      `SELECT id, name, duration_months, amount, registration_fee, security_deposit
       FROM fee_plans WHERE tenant_id = $1 AND deleted_at IS NULL AND is_active
       ORDER BY duration_months NULLS LAST, name`,
      [tenantId]
    )
  ).rows.map((row) => ({
    id: row.id,
    name: row.name,
    months: row.duration_months,
    amountPaise: Number(row.amount),
    registrationPaise: Number(row.registration_fee),
    depositPaise: Number(row.security_deposit),
  }));

  const seats = (
    await client.query(
      `SELECT id, seat_no, row_pos, col_pos, status
       FROM seats WHERE branch_id = $1 AND deleted_at IS NULL
       ORDER BY row_pos, col_pos`,
      [branchId]
    )
  ).rows.map((row) => ({
    id: row.id,
    seatNo: row.seat_no,
    row: row.row_pos,
    col: row.col_pos,
    status: row.status,
  }));

  const students = (
    await client.query(
      `SELECT s.id, s.student_code, s.name, s.mobile, s.guardian_mobile, s.status AS student_status,
              m.id AS membership_id, m.start_date, m.end_date, m.status AS mem_status,
              m.fee_plan_id, m.shift_id, m.seat_id, se.seat_no, sh.name AS shift_name
       FROM students s
       LEFT JOIN LATERAL (
         SELECT * FROM memberships mx
         WHERE mx.student_id = s.id AND mx.deleted_at IS NULL
         ORDER BY CASE mx.status WHEN 'active' THEN 0 WHEN 'paused' THEN 1 WHEN 'expired' THEN 2 ELSE 3 END,
                  mx.end_date DESC
         LIMIT 1
       ) m ON true
       LEFT JOIN seats se ON se.id = m.seat_id
       LEFT JOIN shifts sh ON sh.id = m.shift_id
       WHERE s.tenant_id = $1 AND s.deleted_at IS NULL
       ORDER BY s.created_at DESC`,
      [tenantId]
    )
  ).rows.map((row) => ({
    id: row.id,
    code: row.student_code,
    name: row.name,
    mobile: row.mobile,
    guardian: row.guardian_mobile || "",
    seatNo: row.seat_no || "",
    seatId: row.seat_id,
    shiftId: row.shift_id,
    shiftCode: shiftCode(row.shift_name),
    planId: row.fee_plan_id,
    membershipId: row.membership_id,
    startDate: isoDate(row.start_date),
    endDate: isoDate(row.end_date),
    paused: row.mem_status === "paused" || row.student_status === "paused",
  }));

  const invoices = (
    await client.query(
      `SELECT id, invoice_no, student_id, total_amount, paid_amount, status, invoice_date, due_date
       FROM invoices
       WHERE tenant_id = $1 AND deleted_at IS NULL
       ORDER BY invoice_date DESC, invoice_no DESC`,
      [tenantId]
    )
  ).rows.map((row) => ({
    id: row.id,
    number: row.invoice_no,
    studentId: row.student_id,
    totalPaise: Number(row.total_amount),
    paidPaise: Number(row.paid_amount),
    status: row.status,
    issuedOn: isoDate(row.invoice_date),
    dueOn: isoDate(row.due_date),
  }));

  const payments = (
    await client.query(
      `SELECT id, student_id, invoice_id, amount, mode, paid_at, receipt_no
       FROM payments
       WHERE tenant_id = $1 AND reversed_at IS NULL
       ORDER BY paid_at DESC`,
      [tenantId]
    )
  ).rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    invoiceId: row.invoice_id,
    amountPaise: Number(row.amount),
    mode: row.mode,
    receiptNo: row.receipt_no,
    at: row.paid_at.toISOString(),
    day: row.paid_at.toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 10),
  }));

  const attendance = (
    await client.query(
      `SELECT id, student_id, check_in, check_out, attendance_date
       FROM attendance
       WHERE tenant_id = $1
       ORDER BY check_in DESC NULLS LAST
       LIMIT 200`,
      [tenantId]
    )
  ).rows.map((row) => ({
    id: row.id,
    studentId: row.student_id,
    inAt: row.check_in ? row.check_in.toISOString() : null,
    outAt: row.check_out ? row.check_out.toISOString() : null,
    date: isoDate(row.attendance_date),
  }));

  const settings = tenant?.settings || {};

  return {
    libraryName: tenant?.name || "StudyHub",
    branchName: tenant?.branch_name || "Main",
    branchCode: tenant?.branch_code || "MAIN",
    graceDays: Number(settings.grace_days ?? 3),
    language: tenant?.language || "en",
    shifts,
    plans,
    seats,
    students,
    invoices,
    payments,
    attendance,
  };
}
