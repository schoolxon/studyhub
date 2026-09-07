/**
 * Membership display status is a function of dates, not a cron paint.
 * storedStatus is only for paused|cancelled|transferred|superseded.
 */
export function derivedMembershipStatus(endDateIso, storedStatus, todayIso) {
  if (["paused", "cancelled", "transferred", "superseded"].includes(storedStatus)) {
    return storedStatus;
  }
  const end = new Date(`${endDateIso}T00:00:00Z`);
  const today = new Date(`${todayIso}T00:00:00Z`);
  const daysLeft = Math.round((end - today) / 86400000);
  if (daysLeft < 0) return "expired";
  if (daysLeft >= 1 && daysLeft <= 7) return "expiring";
  return "active";
}

/**
 * Student roster badge: left/blacklisted win; else paused if any paused membership;
 * never stores expiring/expired on the student row.
 */
export function derivedStudentRosterStatus(studentStatus, membershipStatuses) {
  if (studentStatus === "left" || studentStatus === "blacklisted") return studentStatus;
  if (membershipStatuses.includes("paused")) return "paused";
  if (membershipStatuses.some((s) => s === "active" || s === "expiring")) return "active";
  return studentStatus;
}
