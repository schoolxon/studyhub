import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../data/StoreContext";
import { formatInr } from "../../lib/money";
import { Button, Field, Input, Modal, Select } from "../ui/ui";

export function CollectPaymentModal({ open, onClose, student }) {
  const navigate = useNavigate();
  const { invoices, collectPayment } = useStore();
  const duePaise = useMemo(() => {
    if (!student) return 0;
    return invoices
      .filter((inv) => inv.studentId === student.id)
      .reduce((sum, inv) => sum + (inv.totalPaise - inv.paidPaise), 0);
  }, [invoices, student]);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("Cash");
  const [error, setError] = useState("");

  const dueRupees = duePaise / 100;
  const readyRupees = amount === "" ? dueRupees : Number.parseInt(amount, 10);
  const readyAmount = Number.isInteger(readyRupees) ? readyRupees * 100 : NaN;

  const submit = async () => {
    if (!student) return;
    if (!Number.isInteger(readyRupees) || readyRupees <= 0) {
      setError("Amount must be a whole rupee amount.");
      return;
    }
    try {
      const paymentId = await collectPayment({ studentId: student.id, amountPaise: readyAmount, mode });
      setAmount("");
      setError("");
      onClose();
      if (paymentId) navigate(`/app/receipts/${paymentId}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={student ? `Collect — ${student.name}` : "Collect"}
      description={student ? `Seat ${student.seatNo}` : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!student || duePaise <= 0}>
            Collect {formatInr(Number.isInteger(readyAmount) ? readyAmount : 0)}
          </Button>
        </>
      }
    >
      {error ? <p className="ui-alert ui-alert-destructive">{error}</p> : null}
      <p style={{ marginTop: 0 }}>Due {formatInr(duePaise)}</p>
      <Field label="Amount (₹)" htmlFor="pay-amt">
        <Input
          id="pay-amt"
          inputMode="numeric"
          placeholder={String(dueRupees)}
          value={amount}
          onChange={(e) => {
            setError("");
            setAmount(e.target.value);
          }}
        />
      </Field>
      <Field label="Mode" htmlFor="pay-mode">
        <Select id="pay-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>Cash</option>
          <option>UPI</option>
          <option>Card</option>
          <option>Bank</option>
        </Select>
      </Field>
    </Modal>
  );
}
