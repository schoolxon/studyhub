/** Integer paise only — same rule as AUDIT/lib/money.js. */

export function formatInr(paise) {
  if (!Number.isInteger(paise)) {
    throw new TypeError("paise must be an integer");
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function allocateFifo(invoices, amountPaise) {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new TypeError("amountPaise must be a non-negative integer");
  }
  let remaining = amountPaise;
  const paid = invoices.map((inv) => ({ ...inv }));
  for (const inv of paid) {
    const due = inv.totalPaise - inv.paidPaise;
    const pay = Math.min(remaining, due);
    inv.paidPaise += pay;
    inv.status = inv.paidPaise >= inv.totalPaise ? "paid" : pay > 0 ? "partial" : inv.status;
    remaining -= pay;
    if (remaining === 0) break;
  }
  return { invoices: paid, advancePaise: remaining };
}
