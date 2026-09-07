import { calcEndDate, calcEndDateAddMonthsMinusOne, iso, utcDate } from "../lib/dates.js";

const failures = [];

function eq(actual, expected, label) {
  if (actual !== expected) failures.push(`${label}: got ${actual} want ${expected}`);
}

const jan31 = utcDate(2026, 1, 31);
eq(iso(calcEndDate(jan31, { duration_months: 1 })), "2026-02-28", "31 Jan + 1m");
const naive = iso(calcEndDateAddMonthsMinusOne(jan31, 1));
if (naive === "2026-02-28") {
  failures.push("naive addMonths-1 accidentally matches; detector is useless");
}
if (iso(calcEndDate(jan31, { duration_months: 1 })) === naive) {
  failures.push("production calcEndDate must not use naive addMonths-1");
}
eq(iso(calcEndDate(utcDate(2026, 9, 5), { duration_months: 1 })), "2026-10-04", "5 Sep + 1m");
eq(iso(calcEndDate(utcDate(2026, 11, 30), { duration_months: 3 })), "2027-02-28", "30 Nov + 3m non-leap");
eq(iso(calcEndDate(utcDate(2027, 11, 30), { duration_months: 3 })), "2028-02-29", "30 Nov + 3m leap");
eq(iso(calcEndDate(utcDate(2026, 9, 5), { duration_days: 30 })), "2026-10-04", "30 days");

if (failures.length) {
  console.error("FAIL P1-14\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P1-14 date math (31 Jan → 28 Feb, not 27)");
