export function renewMembership({ oldEnd, startFrom, today }) {
  if (startFrom === "today" && today < oldEnd) {
    return {
      oldStatus: "superseded",
      newStart: today,
      gap: false,
    };
  }
  if (startFrom === "expiry") {
    return {
      oldStatus: "expired",
      newStart: addDaysIso(oldEnd, 1),
      gap: today > addDaysIso(oldEnd, 1),
    };
  }
  return { oldStatus: "expired", newStart: today, gap: false };
}

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
