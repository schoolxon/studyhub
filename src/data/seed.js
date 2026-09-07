import { addDays, addMonths, todayIso } from "../lib/dates";

export const SHIFTS = [
  { id: "morning", name: "Morning", hours: "06:00–12:00" },
  { id: "noon", name: "Noon", hours: "12:00–18:00" },
  { id: "evening", name: "Evening", hours: "18:00–23:00" },
  { id: "fullday", name: "Full Day", hours: "06:00–23:00" },
];

export const PLANS = [
  { id: "1m", name: "1 Month", months: 1, amountPaise: 80_000 },
  { id: "3m", name: "3 Months", months: 3, amountPaise: 220_000 },
  { id: "6m", name: "6 Months", months: 6, amountPaise: 400_000 },
];

export const REGISTRATION_PAISE = 10_000;
export const DEPOSIT_PAISE = 50_000;
export const ROWS = ["A", "B", "C", "D", "E", "F"];
export const COLS = 10;

export function seatNo(row, col) {
  return `${row}-${String(col).padStart(2, "0")}`;
}

export function allSeats() {
  const seats = [];
  for (const row of ROWS) {
    for (let col = 1; col <= COLS; col += 1) {
      seats.push(seatNo(row, col));
    }
  }
  return seats;
}

export function createSeed(today = todayIso()) {
  const students = [
    { id: "s1", name: "Riya Sharma", mobile: "9876500001", guardian: "9811100001", seatNo: "A-01", shiftId: "morning", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, 1), paused: false },
    { id: "s2", name: "Aman Gupta", mobile: "9876500002", guardian: "9811100002", seatNo: "B-04", shiftId: "morning", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, 3), paused: false },
    { id: "s3", name: "Neha Verma", mobile: "9876500003", guardian: "9811100003", seatNo: "C-08", shiftId: "morning", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, -3), paused: false },
    { id: "s4", name: "Kabir Singh", mobile: "9876500004", guardian: "9811100004", seatNo: "D-02", shiftId: "evening", planId: "3m", startDate: addMonths(today, -1), endDate: addMonths(today, 2), paused: false },
    { id: "s5", name: "Sana Ali", mobile: "9876500005", guardian: "9811100005", seatNo: "A-05", shiftId: "noon", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, 20), paused: true },
    { id: "s6", name: "Rohan Mehta", mobile: "9876500006", guardian: "9811100006", seatNo: "E-07", shiftId: "morning", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, 12), paused: false },
    { id: "s7", name: "Ishita Rao", mobile: "9876500007", guardian: "9811100007", seatNo: "F-01", shiftId: "fullday", planId: "6m", startDate: addMonths(today, -2), endDate: addMonths(today, 4), paused: false },
    { id: "s8", name: "Vivek Patel", mobile: "9876500008", guardian: "9811100008", seatNo: "B-09", shiftId: "morning", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, -10), paused: false },
    { id: "s9", name: "Meera Joshi", mobile: "9876500009", guardian: "9811100009", seatNo: "C-03", shiftId: "evening", planId: "1m", startDate: addMonths(today, -1), endDate: addDays(today, 7), paused: false },
    { id: "s10", name: "Arjun Nair", mobile: "9876500010", guardian: "9811100010", seatNo: "D-10", shiftId: "morning", planId: "3m", startDate: addMonths(today, -2), endDate: addMonths(today, 1), paused: false },
  ];

  const invoices = [
    { id: "inv1", number: "SH-2026-0001", studentId: "s1", totalPaise: 80_000, paidPaise: 80_000, status: "paid", issuedOn: addMonths(today, -1) },
    { id: "inv2", number: "SH-2026-0002", studentId: "s2", totalPaise: 80_000, paidPaise: 80_000, status: "paid", issuedOn: addMonths(today, -1) },
    { id: "inv3", number: "SH-2026-0003", studentId: "s3", totalPaise: 80_000, paidPaise: 0, status: "overdue", issuedOn: addMonths(today, -1) },
    { id: "inv4", number: "SH-2026-0004", studentId: "s6", totalPaise: 80_000, paidPaise: 40_000, status: "partial", issuedOn: addMonths(today, -1) },
    { id: "inv5", number: "SH-2026-0005", studentId: "s8", totalPaise: 80_000, paidPaise: 0, status: "overdue", issuedOn: addMonths(today, -1) },
    { id: "inv6", number: "SH-2026-0006", studentId: "s9", totalPaise: 80_000, paidPaise: 80_000, status: "paid", issuedOn: addMonths(today, -1) },
  ];

  const payments = [
    { id: "p1", studentId: "s10", invoiceId: "inv6", amountPaise: 80_000, mode: "UPI", at: `${today}T09:12:00` },
    { id: "p2", studentId: "s4", invoiceId: null, amountPaise: 4_000, mode: "Cash", at: `${today}T11:40:00` },
  ];

  const attendance = [
    { id: "a1", studentId: "s10", inAt: `${today}T07:05:00`, outAt: null },
    { id: "a2", studentId: "s1", inAt: `${today}T06:40:00`, outAt: null },
    { id: "a3", studentId: "s2", inAt: `${today}T06:55:00`, outAt: `${today}T11:10:00` },
  ];

  return {
    libraryName: "Aarav Study Hall",
    branchName: "Main",
    graceDays: 3,
    language: "en",
    nextInvoice: 7,
    nextStudent: 11,
    students,
    invoices,
    payments,
    attendance,
  };
}
