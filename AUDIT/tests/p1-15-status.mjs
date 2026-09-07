import { derivedMembershipStatus, derivedStudentRosterStatus } from "../lib/status.js";

const failures = [];
function eq(a, e, l) {
  if (a !== e) failures.push(`${l}: ${a} != ${e}`);
}

eq(derivedMembershipStatus("2026-09-14", "active", "2026-09-07"), "expiring", "day 7");
eq(derivedMembershipStatus("2026-09-13", "active", "2026-09-07"), "expiring", "day 6");
eq(derivedMembershipStatus("2026-09-11", "active", "2026-09-07"), "expiring", "day 4");
eq(derivedMembershipStatus("2026-09-09", "active", "2026-09-07"), "expiring", "day 2");
eq(derivedMembershipStatus("2026-09-16", "active", "2026-09-07"), "active", "day 9");
eq(derivedMembershipStatus("2026-09-06", "active", "2026-09-07"), "expired", "yesterday");
eq(derivedMembershipStatus("2026-09-20", "paused", "2026-09-07"), "paused", "paused wins");

eq(derivedStudentRosterStatus("active", ["expiring", "active"]), "active", "two memberships");
eq(derivedStudentRosterStatus("active", ["paused", "active"]), "paused", "any pause");
eq(derivedStudentRosterStatus("left", ["active"]), "left", "left wins");

if (failures.length) {
  console.error("FAIL P1-15/16\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P1-15/16 derived membership + student roster status");
