import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const empty = {
  libraryName: "",
  branchName: "",
  graceDays: 3,
  language: "en",
  shifts: [],
  plans: [],
  seats: [],
  students: [],
  invoices: [],
  payments: [],
  attendance: [],
  expenses: [],
  expenseCategories: [],
  gstin: "",
  integrations: {},
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(empty);
  const [ready, setReady] = useState(!getToken());
  const [bootError, setBootError] = useState("");

  const hydrate = useCallback((next) => {
    if (next) setState(next);
  }, []);

  const refresh = useCallback(async () => {
    const data = await api("/v1/state");
    hydrate(data.state);
    return data.state;
  }, [hydrate]);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    refresh()
      .then(() => {
        if (!cancelled) setBootError("");
      })
      .catch((error) => {
        if (!cancelled) {
          setToken(null);
          setState(empty);
          setBootError(error.message);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const data = await api("/v1/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    hydrate(data.state);
    return data.state;
  }, [hydrate]);

  const signup = useCallback(async (payload) => {
    const data = await api("/v1/auth/signup", { method: "POST", body: payload });
    setToken(data.token);
    hydrate(data.state);
    return data.state;
  }, [hydrate]);

  const logout = useCallback(() => {
    setToken(null);
    setState(empty);
  }, []);

  const occupiedSeatKeys = useMemo(() => {
    const keys = new Set();
    for (const student of state.students) {
      if (student.shiftId && student.seatNo) keys.add(`${student.shiftId}:${student.seatNo}`);
    }
    return keys;
  }, [state.students]);

  const isSeatFree = useCallback(
    (seatNo, shiftId) => !state.students.some((student) => student.shiftId === shiftId && student.seatNo === seatNo),
    [state.students]
  );

  const addAdmission = useCallback(async (form) => {
    const data = await api("/v1/admissions", { method: "POST", body: form });
    hydrate(data.state);
    return data.created;
  }, [hydrate]);

  const collectPayment = useCallback(async ({ studentId, amountPaise, mode }) => {
    const data = await api("/v1/payments", { method: "POST", body: { studentId, amountPaise, mode } });
    hydrate(data.state);
    return data.paymentId;
  }, [hydrate]);

  const togglePause = useCallback(async (studentId) => {
    const data = await api(`/v1/students/${studentId}/pause`, { method: "POST" });
    hydrate(data.state);
  }, [hydrate]);

  const renewMembership = useCallback(async (studentId, planId, payingNow, mode) => {
    const student = state.students.find((item) => item.id === studentId);
    if (!student?.membershipId) throw new Error("No membership to renew");
    const data = await api("/v1/memberships/renew", {
      method: "POST",
      body: { membershipId: student.membershipId, planId, payingNow, mode },
    });
    hydrate(data.state);
  }, [hydrate, state.students]);

  const checkIn = useCallback(async (studentId) => {
    const data = await api("/v1/attendance/check-in", { method: "POST", body: { studentId } });
    hydrate(data.state);
  }, [hydrate]);

  const checkOut = useCallback(async (studentId) => {
    const data = await api("/v1/attendance/check-out", { method: "POST", body: { studentId } });
    hydrate(data.state);
  }, [hydrate]);

  const updateSettings = useCallback(async (patch) => {
    const data = await api("/v1/settings", { method: "PATCH", body: patch });
    hydrate(data.state);
  }, [hydrate]);

  const addExpense = useCallback(async (payload) => {
    const data = await api("/v1/expenses", { method: "POST", body: payload });
    hydrate(data.state);
  }, [hydrate]);

  const removeExpense = useCallback(async (id) => {
    const data = await api(`/v1/expenses/${id}`, { method: "DELETE" });
    hydrate(data.state);
  }, [hydrate]);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      bootError,
      signedIn: Boolean(getToken()),
      occupiedSeatKeys,
      isSeatFree,
      login,
      signup,
      logout,
      refresh,
      addAdmission,
      collectPayment,
      togglePause,
      renewMembership,
      checkIn,
      checkOut,
      updateSettings,
      addExpense,
      removeExpense,
    }),
    [
      state,
      ready,
      bootError,
      occupiedSeatKeys,
      isSeatFree,
      login,
      signup,
      logout,
      refresh,
      addAdmission,
      collectPayment,
      togglePause,
      renewMembership,
      checkIn,
      checkOut,
      updateSettings,
      addExpense,
      removeExpense,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreProvider");
  return value;
}
