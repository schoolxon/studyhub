import { useEffect, useMemo, useState } from "react";
import { useStore } from "../../data/StoreContext";
import { addMonths, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";
import { Button, Field, Modal, Select } from "../ui/ui";

export function RenewModal({ open, onClose, student }) {
  const { renewMembership, plans } = useStore();
  const [planId, setPlanId] = useState("");
  const [mode, setMode] = useState("UPI");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPlanId(student?.planId || plans[0]?.id || "");
    setError("");
  }, [student, plans, open]);

  const plan = plans.find((item) => item.id === planId) || plans[0];
  const from = student && student.endDate >= todayIso() ? student.endDate : todayIso();

  const submit = async () => {
    if (!student || !plan) return;
    setSaving(true);
    try {
      await renewMembership(student.id, plan.id, plan.amountPaise, mode);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const period = useMemo(() => {
    if (!plan) return "";
    const start = student ? from : todayIso();
    return `${start} → ${addMonths(start, plan.months || 1)}`;
  }, [from, plan, student]);

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
          <Button variant="primary" onClick={submit} disabled={!student || !plan || saving}>
            {saving ? "Saving…" : `Renew & collect ${plan ? formatInr(plan.amountPaise) : ""}`}
          </Button>
        </>
      }
    >
      {error ? <p className="ui-alert ui-alert-destructive">{error}</p> : null}
      <Field label="Plan" htmlFor="ren-plan">
        <Select id="ren-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          {plans.map((item) => (
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
