/** Integer paise only. Never Number money that is not an integer. */

export function rupeesToPaise(rupees) {
  if (!Number.isInteger(rupees)) {
    throw new TypeError("rupees must be an integer rupee amount");
  }
  return rupees * 100;
}

export function paiseToRupees(paise) {
  if (!Number.isInteger(paise)) {
    throw new TypeError("paise must be an integer");
  }
  return paise / 100;
}

export function roundRupeeFromPaise(paiseFloat) {
  return Math.round(paiseFloat);
}

export function allocateFifo(invoices, amountPaise) {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new TypeError("amountPaise must be a non-negative integer");
  }
  let remaining = amountPaise;
  const paid = invoices.map((inv) => ({ ...inv }));
  for (const inv of paid) {
    const due = inv.total_amount - inv.paid_amount;
    const pay = Math.min(remaining, due);
    inv.paid_amount += pay;
    inv.status = inv.paid_amount >= inv.total_amount ? "paid" : pay > 0 ? "partial" : inv.status;
    remaining -= pay;
    if (remaining === 0) break;
  }
  return { invoices: paid, advancePaise: remaining };
}
