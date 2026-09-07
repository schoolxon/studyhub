import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { addMonths, todayIso } from "../lib/dates";
import { allocateFifo } from "../lib/money";
import { DEPOSIT_PAISE, PLANS, REGISTRATION_PAISE, createSeed } from "./seed";

const StoreContext = createContext(null);

function nextId(prefix, n) {
  return `${prefix}${n}`;
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(() => createSeed());

  const occupiedSeatKeys = useMemo(() => {
    const keys = new Set();
    for (const student of state.students) {
      keys.add(`${student.shiftId}:${student.seatNo}`);
    }
    return keys;
  }, [state.students]);

  const isSeatFree = useCallback(
    (seatNo, shiftId, exceptStudentId) => {
      return !state.students.some(
        (student) =>
          student.id !== exceptStudentId &&
          student.shiftId === shiftId &&
          student.seatNo === seatNo
      );
    },
    [state.students]
  );

  const addAdmission = useCallback((form) => {
    const plan = PLANS.find((item) => item.id === form.planId);
    if (!plan) throw new Error("Unknown plan");
    const startDate = form.startDate || todayIso();
    const endDate = addMonths(startDate, plan.months);
    const discountPaise = Number.parseInt(form.discountPaise || "0", 10) || 0;
    const totalPaise = plan.amountPaise + REGISTRATION_PAISE + DEPOSIT_PAISE - discountPaise;
    if (totalPaise < 0) throw new Error("Discount larger than bill");
    const payingNow = Number.parseInt(form.payingNow || String(totalPaise), 10) || 0;

    setState((prev) => {
      const studentId = nextId("s", prev.nextStudent);
      const invoiceId = nextId("inv", prev.nextInvoice);
      const number = `SH-2026-${String(prev.nextInvoice).padStart(4, "0")}`;
      const invoice = {
        id: invoiceId,
        number,
        studentId,
        totalPaise,
        paidPaise: 0,
        status: "open",
        issuedOn: startDate,
      };
      const allocated = allocateFifo([invoice], payingNow);
      const paidInvoice = allocated.invoices[0];
      const student = {
        id: studentId,
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        guardian: form.guardian.trim(),
        seatNo: form.seatNo,
        shiftId: form.shiftId,
        planId: form.planId,
        startDate,
        endDate,
        paused: false,
      };
      const payment =
        payingNow > 0
          ? {
              id: `p${prev.payments.length + 1}`,
              studentId,
              invoiceId,
              amountPaise: payingNow - allocated.advancePaise,
              mode: form.mode,
              at: `${todayIso()}T${new Date().toTimeString().slice(0, 8)}`,
            }
          : null;

      return {
        ...prev,
        nextStudent: prev.nextStudent + 1,
        nextInvoice: prev.nextInvoice + 1,
        students: [student, ...prev.students],
        invoices: [paidInvoice, ...prev.invoices],
        payments: payment && payment.amountPaise > 0 ? [payment, ...prev.payments] : prev.payments,
      };
    });
  }, []);

  const collectPayment = useCallback(({ studentId, amountPaise, mode }) => {
    setState((prev) => {
      const open = prev.invoices.filter(
        (inv) => inv.studentId === studentId && inv.paidPaise < inv.totalPaise
      );
      const others = prev.invoices.filter((inv) => !open.some((item) => item.id === inv.id));
      const result = allocateFifo(open, amountPaise);
      const payment = {
        id: `p${prev.payments.length + 1}`,
        studentId,
        invoiceId: result.invoices[0]?.id ?? null,
        amountPaise: amountPaise - result.advancePaise,
        mode,
        at: `${todayIso()}T${new Date().toTimeString().slice(0, 8)}`,
      };
      return {
        ...prev,
        invoices: [...result.invoices, ...others],
        payments: payment.amountPaise > 0 ? [payment, ...prev.payments] : prev.payments,
      };
    });
  }, []);

  const togglePause = useCallback((studentId) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((student) =>
        student.id === studentId ? { ...student, paused: !student.paused } : student
      ),
    }));
  }, []);

  const renewMembership = useCallback((studentId, planId, payingNow, mode) => {
    const plan = PLANS.find((item) => item.id === planId);
    if (!plan) throw new Error("Unknown plan");
    setState((prev) => {
      const student = prev.students.find((item) => item.id === studentId);
      if (!student) return prev;
      const from = student.endDate >= todayIso() ? addDaysSafe(student.endDate, 1) : todayIso();
      const endDate = addMonths(from, plan.months);
      const invoiceId = nextId("inv", prev.nextInvoice);
      const invoice = {
        id: invoiceId,
        number: `SH-2026-${String(prev.nextInvoice).padStart(4, "0")}`,
        studentId,
        totalPaise: plan.amountPaise,
        paidPaise: 0,
        status: "open",
        issuedOn: todayIso(),
      };
      const result = allocateFifo([invoice], payingNow);
      const payment =
        payingNow > 0
          ? {
              id: `p${prev.payments.length + 1}`,
              studentId,
              invoiceId,
              amountPaise: payingNow - result.advancePaise,
              mode,
              at: `${todayIso()}T${new Date().toTimeString().slice(0, 8)}`,
            }
          : null;
      return {
        ...prev,
        nextInvoice: prev.nextInvoice + 1,
        students: prev.students.map((item) =>
          item.id === studentId ? { ...item, planId, startDate: from, endDate } : item
        ),
        invoices: [result.invoices[0], ...prev.invoices],
        payments: payment && payment.amountPaise > 0 ? [payment, ...prev.payments] : prev.payments,
      };
    });
  }, []);

  const checkIn = useCallback((studentId) => {
    setState((prev) => {
      if (prev.attendance.some((row) => row.studentId === studentId && !row.outAt)) return prev;
      return {
        ...prev,
        attendance: [
          {
            id: `a${prev.attendance.length + 1}`,
            studentId,
            inAt: `${todayIso()}T${new Date().toTimeString().slice(0, 8)}`,
            outAt: null,
          },
          ...prev.attendance,
        ],
      };
    });
  }, []);

  const checkOut = useCallback((studentId) => {
    setState((prev) => ({
      ...prev,
      attendance: prev.attendance.map((row) =>
        row.studentId === studentId && !row.outAt
          ? { ...row, outAt: `${todayIso()}T${new Date().toTimeString().slice(0, 8)}` }
          : row
      ),
    }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      occupiedSeatKeys,
      isSeatFree,
      addAdmission,
      collectPayment,
      togglePause,
      renewMembership,
      checkIn,
      checkOut,
      updateSettings,
    }),
    [
      state,
      occupiedSeatKeys,
      isSeatFree,
      addAdmission,
      collectPayment,
      togglePause,
      renewMembership,
      checkIn,
      checkOut,
      updateSettings,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

function addDaysSafe(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  cursor.setDate(cursor.getDate() + days);
  const y = cursor.getFullYear();
  const m = String(cursor.getMonth() + 1).padStart(2, "0");
  const d = String(cursor.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
