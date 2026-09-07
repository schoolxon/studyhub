import { allocateFifo, rupeesToPaise } from "../lib/money.js";

const failures = [];
try {
  rupeesToPaise(800.5);
  failures.push("float rupees must throw");
} catch {
  /* expected */
}

const fiveHundred = rupeesToPaise(500);
const result = allocateFifo(
  [
    { id: "a", total_amount: rupeesToPaise(300), paid_amount: 0, status: "unpaid" },
    { id: "b", total_amount: rupeesToPaise(400), paid_amount: 0, status: "unpaid" },
  ],
  fiveHundred
);
if (result.invoices[0].status !== "paid") failures.push("first invoice should be paid");
if (result.invoices[0].paid_amount !== rupeesToPaise(300)) failures.push("first paid 300");
if (result.invoices[1].status !== "partial") failures.push("second should be partial");
if (result.invoices[1].paid_amount !== rupeesToPaise(200)) failures.push("second paid 200");
if (result.advancePaise !== 0) failures.push("no leftover");

const over = allocateFifo(
  [{ id: "a", total_amount: rupeesToPaise(100), paid_amount: 0, status: "unpaid" }],
  rupeesToPaise(150)
);
if (over.advancePaise !== rupeesToPaise(50)) failures.push("advance 50 rupees in paise");

if (failures.length) {
  console.error("FAIL P0-05\n" + failures.map((f) => ` - ${f}`).join("\n"));
  process.exit(1);
}
console.log("PASS P0-05 integer paise + FIFO ₹500 → 300 paid / 200 partial");
