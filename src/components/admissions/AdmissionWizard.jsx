import { useState } from "react";
import { DEPOSIT_PAISE, PLANS, REGISTRATION_PAISE, ROWS, COLS, SHIFTS, seatNo } from "../../data/seed";
import { useStore } from "../../data/StoreContext";
import { addMonths, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";
import { Button, Field, Input, Modal, Select } from "../ui/ui";

const emptyForm = {
  name: "",
  mobile: "",
  guardian: "",
  shiftId: "morning",
  seatNo: "",
  planId: "1m",
  startDate: todayIso(),
  discountRupees: "0",
  payingNowRupees: "",
  mode: "Cash",
};

export function AdmissionWizard({ open, onClose, onCreated }) {
  const { isSeatFree, addAdmission } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const plan = PLANS.find((item) => item.id === form.planId);
  const discountPaise = (Number.parseInt(form.discountRupees || "0", 10) || 0) * 100;
  const totalPaise = plan.amountPaise + REGISTRATION_PAISE + DEPOSIT_PAISE - discountPaise;
  const endDate = addMonths(form.startDate || todayIso(), plan.months);

  const patch = (partial) => {
    setError("");
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const reset = () => {
    setStep(1);
    setForm({ ...emptyForm, startDate: todayIso() });
    setError("");
  };

  const close = () => {
    reset();
    onClose();
  };

  const nextFromDetails = () => {
    if (!form.name.trim() || !form.mobile.trim()) {
      setError("Name and mobile are required.");
      return;
    }
    setStep(2);
  };

  const nextFromSeat = () => {
    if (!form.seatNo) {
      setError("Pick an available seat.");
      return;
    }
    if (!isSeatFree(form.seatNo, form.shiftId)) {
      setError("That seat is already held for this shift.");
      return;
    }
    patch({ payingNowRupees: String(Math.max(totalPaise, 0) / 100) });
    setStep(3);
  };

  const save = () => {
    try {
      addAdmission({
        ...form,
        payingNow: String((Number.parseInt(form.payingNowRupees || "0", 10) || 0) * 100),
        discountPaise: String(discountPaise),
      });
      const created = { name: form.name, seatNo: form.seatNo, shiftId: form.shiftId, endDate };
      reset();
      onClose();
      onCreated?.(created);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={`New admission — step ${step} of 3`}
      description="Demo only. Nothing is saved to Postgres."
      footer={
        <>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep((value) => value - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
          )}
          {step === 1 ? (
            <Button variant="primary" onClick={nextFromDetails}>
              Next
            </Button>
          ) : null}
          {step === 2 ? (
            <Button variant="primary" onClick={nextFromSeat}>
              Next
            </Button>
          ) : null}
          {step === 3 ? (
            <Button variant="primary" onClick={save}>
              Save & print receipt
            </Button>
          ) : null}
        </>
      }
    >
      {error ? (
        <p className="ui-alert ui-alert-destructive" style={{ marginBottom: 12 }}>
          {error}
        </p>
      ) : null}

      {step === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Student name" htmlFor="adm-name">
            <Input id="adm-name" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <Field label="Mobile" htmlFor="adm-mobile">
            <Input id="adm-mobile" inputMode="numeric" value={form.mobile} onChange={(e) => patch({ mobile: e.target.value })} />
          </Field>
          <Field label="Guardian mobile" htmlFor="adm-guardian">
            <Input id="adm-guardian" inputMode="numeric" value={form.guardian} onChange={(e) => patch({ guardian: e.target.value })} />
          </Field>
          <p className="md:col-span-2 text-sm" style={{ color: "var(--muted-foreground)", margin: 0 }}>
            Photo capture is skipped in this shell.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {SHIFTS.map((shift) => (
              <button
                key={shift.id}
                type="button"
                className={`ui-tab-pill${form.shiftId === shift.id ? " active" : ""}`}
                onClick={() => patch({ shiftId: shift.id, seatNo: "" })}
              >
                {shift.name}
              </button>
            ))}
          </div>
          <Field label="Plan" htmlFor="adm-plan">
            <Select id="adm-plan" value={form.planId} onChange={(e) => patch({ planId: e.target.value })}>
              {PLANS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {formatInr(item.amountPaise)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start date" htmlFor="adm-start">
            <Input id="adm-start" type="date" value={form.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
          </Field>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            End date {endDate}. Green seats are free for this shift.
          </p>
          <div className="sh-seat-grid" style={{ marginTop: 12 }}>
            {ROWS.map((row) =>
              Array.from({ length: COLS }, (_, index) => {
                const no = seatNo(row, index + 1);
                const free = isSeatFree(no, form.shiftId);
                const selected = form.seatNo === no;
                return (
                  <button
                    key={no}
                    type="button"
                    disabled={!free}
                    className={`sh-seat${free ? " is-free" : " is-held"}${selected ? " is-selected" : ""}`}
                    onClick={() => patch({ seatNo: no })}
                  >
                    {no}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <p style={{ margin: 0 }}>
            Plan {formatInr(plan.amountPaise)} + registration {formatInr(REGISTRATION_PAISE)} + deposit{" "}
            {formatInr(DEPOSIT_PAISE)}
          </p>
          <p style={{ margin: 0 }}>
            Seat {form.seatNo} · {SHIFTS.find((s) => s.id === form.shiftId)?.name} · till {endDate}
          </p>
          <Field label="Discount (₹)" htmlFor="adm-disc">
            <Input
              id="adm-disc"
              inputMode="numeric"
              value={form.discountRupees}
              onChange={(e) => patch({ discountRupees: e.target.value })}
            />
          </Field>
          <Field label="Total" htmlFor="adm-total">
            <Input id="adm-total" readOnly value={formatInr(Math.max(totalPaise, 0))} />
          </Field>
          <Field label="Paying now (₹)" htmlFor="adm-pay">
            <Input id="adm-pay" inputMode="numeric" value={form.payingNowRupees} onChange={(e) => patch({ payingNowRupees: e.target.value })} />
          </Field>
          <Field label="Mode" htmlFor="adm-mode">
            <Select id="adm-mode" value={form.mode} onChange={(e) => patch({ mode: e.target.value })}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Other</option>
            </Select>
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
