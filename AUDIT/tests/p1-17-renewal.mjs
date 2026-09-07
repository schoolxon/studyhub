import { renewMembership } from "../lib/renewal.js";

const failures = [];
const mid = renewMembership({ oldEnd: "2026-09-30", startFrom: "today", today: "2026-09-10" });
if (mid.oldStatus !== "superseded") failures.push("today renew must supersede, not expire");
if (mid.newStart !== "2026-09-10") failures.push("new start is today");

const late = renewMembership({ oldEnd: "2026-09-01", startFrom: "expiry", today: "2026-09-10" });
if (late.oldStatus !== "expired") failures.push("after end stays expired");

if (failures.length) {
  console.error("FAIL P1-17\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P1-17 renew start_from=today → superseded");
