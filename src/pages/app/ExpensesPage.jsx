import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Alert } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatDay, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";

export default function ExpensesPage() {
  const { expenses, expenseCategories, addExpense, removeExpense } = useStore();
  const [categoryId, setCategoryId] = useState(expenseCategories[0]?.id || "");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayIso());
  const [mode, setMode] = useState("Cash");
  const [vendor, setVendor] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!categoryId && expenseCategories[0]) setCategoryId(expenseCategories[0].id);
  }, [categoryId, expenseCategories]);

  const rupees = Number.parseInt(amount, 10);
  const total = expenses.reduce((sum, row) => sum + row.amountPaise, 0);

  const submit = async (event) => {
    event.preventDefault();
    if (!Number.isInteger(rupees) || rupees <= 0) {
      setError("Amount must be a whole rupee amount.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addExpense({
        categoryId: categoryId || null,
        amountPaise: rupees * 100,
        expenseDate,
        mode,
        vendor,
        note,
      });
      setAmount("");
      setVendor("");
      setNote("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Expenses" description={`Recorded ${formatInr(total)}.`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader title="Add expense" />
          <CardBody>
            {error ? <Alert variant="error">{error}</Alert> : null}
            <form onSubmit={submit}>
              <Field label="Category" htmlFor="exp-cat">
                <Select id="exp-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                  <option value="">Other</option>
                  {expenseCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Amount (₹)" htmlFor="exp-amt">
                <Input
                  id="exp-amt"
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setError("");
                    setAmount(e.target.value);
                  }}
                />
              </Field>
              <Field label="Date" htmlFor="exp-date">
                <Input id="exp-date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              </Field>
              <Field label="Mode" htmlFor="exp-mode">
                <Select id="exp-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Card</option>
                  <option>Bank</option>
                </Select>
              </Field>
              <Field label="Vendor" htmlFor="exp-vendor">
                <Input id="exp-vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} />
              </Field>
              <Field label="Note" htmlFor="exp-note">
                <Input id="exp-note" value={note} onChange={(e) => setNote(e.target.value)} />
              </Field>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving…" : "Save expense"}
              </Button>
            </form>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Recent" />
          <CardBody>
            {expenses.length === 0 ? (
              <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No expenses yet.</p>
            ) : (
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vendor</th>
                    <th>Mode</th>
                    <th>Amount</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((row) => (
                    <tr key={row.id}>
                      <td>{formatDay(row.date)}</td>
                      <td>{row.category}</td>
                      <td>{row.vendor || "—"}</td>
                      <td>{row.mode}</td>
                      <td>{formatInr(row.amountPaise)}</td>
                      <td>
                        <Button variant="ghost" size="sm" onClick={() => removeExpense(row.id)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
