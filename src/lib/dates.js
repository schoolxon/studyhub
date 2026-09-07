export function todayIso(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addMonths(iso, months) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  const originalDay = cursor.getDate();
  cursor.setMonth(cursor.getMonth() + months);
  if (cursor.getDate() !== originalDay) cursor.setDate(0);
  return todayIso(cursor);
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const cursor = new Date(year, month - 1, day);
  cursor.setDate(cursor.getDate() + days);
  return todayIso(cursor);
}

export function daysLeft(endIso, today = todayIso()) {
  const end = new Date(`${endIso}T00:00:00`);
  const start = new Date(`${today}T00:00:00`);
  return Math.round((end - start) / 86_400_000);
}

export function formatDay(iso) {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function membershipLabel(endIso, paused, today = todayIso()) {
  if (paused) return "paused";
  const left = daysLeft(endIso, today);
  if (left < 0) return "overdue";
  if (left <= 7) return "expiring";
  return "active";
}
