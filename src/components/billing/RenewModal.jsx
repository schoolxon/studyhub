import { useMemo, useState } from "react";
import { PLANS } from "../../data/seed";
import { useStore } from "../../data/StoreContext";
import { addMonths, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";
import { Button, Field, Modal, Select } from "../ui/ui";

export function RenewModal({ open, onClose, student }) {
  const { renewMembership } = useStore();
  const [planId, setPlanId] = useState(student?.planId || "1m");
  const [mode, setMode] = useState("UPI");
  const plan = PLANS.find((item) => item.id === planId) || PLANS[0];
  const from = student && student.endDate >= todayIso() ? student.endDate : todayIso();

  const submit = () => {
    if (!student) return;
    renewMembership(student.id, planId, plan.amountPaise, mode);
    onClose();
  };

  const period = useMemo(() => {
    const start = student ? from : todayIso();
    return `${start} → ${addMonths(start, plan.months)}`;
  }, [from, plan.months, student]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={student ? `Renew — ${student.name}` : "Renew"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} disabled={!student}>
            Renew & collect {formatInr(plan.amountPaise)}
          </Button>
        </>
      }
    >
      <Field label="Plan" htmlFor="ren-plan">
        <Select
          id="ren-plan"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        >
          {PLANS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {formatInr(item.amountPaise)}
            </option>
          ))}
        </Select>
      </Field>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        New period {period}. Seat stays {student?.seatNo}.
      </p>
      <Field label="Mode" htmlFor="ren-mode">
        <Select id="ren-mode" value={mode} onChange={(e) => setMode(e.target.value)}>
          <option>UPI</option>
          <option>Cash</option>
          <option>Card</option>
        </Select>
      </Field>
    </Modal>
  );
}
