/** Calendar month-end membership dates. Spec 07 — not addMonths then -1. */

function utcDate(y, m, d) {
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Wrong algorithm kept as a detector — tests assert we do NOT use this. */
export function calcEndDateAddMonthsMinusOne(startDate, months) {
  const y = startDate.getUTCFullYear();
  const m = startDate.getUTCMonth();
  const d = startDate.getUTCDate();
  const moved = new Date(Date.UTC(y, m + months, d));
  return addDays(moved, -1);
}

export function calcEndDate(startDate, plan) {
  if (plan.duration_days) {
    return addDays(startDate, plan.duration_days - 1);
  }
  const n = plan.duration_months;
  const y = startDate.getUTCFullYear();
  const m = startDate.getUTCMonth();
  const d = startDate.getUTCDate();
  const lastOfStart = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  if (d === lastOfStart) {
    return new Date(Date.UTC(y, m + n + 1, 0));
  }
  return addDays(new Date(Date.UTC(y, m + n, d)), -1);
}

export function iso(date) {
  return date.toISOString().slice(0, 10);
}

export { utcDate };
