import { useEffect, useState } from "react";
import { useStore } from "../../data/StoreContext";
import { addMonths, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";
import { Button, Field, Input, Modal, Select } from "../ui/ui";

function blank(shifts, plans) {
  return {
    name: "",
    mobile: "",
    guardian: "",
    shiftId: shifts[0]?.id || "",
    seatNo: "",
    planId: plans[0]?.id || "",
    startDate: todayIso(),
    discountRupees: "0",
    payingNowRupees: "",
    mode: "Cash",
  };
}

export function AdmissionWizard({ open, onClose, onCreated }) {
  const { isSeatFree, addAdmission, shifts, plans, seats } = useStore();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => blank(shifts, plans));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError("");
    setForm(blank(shifts, plans));
  }, [open, shifts, plans]);

  const plan = plans.find((item) => item.id === form.planId) || plans[0];
  const discountPaise = (Number.parseInt(form.discountRupees || "0", 10) || 0) * 100;
  const registration = plan?.registrationPaise || 0;
  const deposit = plan?.depositPaise || 0;
  const totalPaise = plan ? plan.amountPaise + registration + deposit - discountPaise : 0;
  const endDate = plan ? addMonths(form.startDate || todayIso(), plan.months || 1) : "";

  const patch = (partial) => {
    setError("");
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const close = () => {
    setStep(1);
    setForm(blank(shifts, plans));
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

  const save = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const created = await addAdmission({
        ...form,
        payingNow: String((Number.parseInt(form.payingNowRupees || "0", 10) || 0) * 100),
        discountPaise: String(discountPaise),
      });
      close();
      onCreated?.({
        name: form.name,
        seatNo: created?.seatNo || form.seatNo,
        endDate: created?.endDate || endDate,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      size="xl"
      title={`New admission — step ${step} of 3`}
      description="Saved to Postgres with GiST seat exclusion and FIFO payment."
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
            <Button variant="primary" onClick={save} disabled={saving || !plan}>
              {saving ? "Saving…" : "Save & collect"}
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
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            {shifts.map((shift) => (
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
              {plans.map((item) => (
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
            {seats.map((seat) => {
              const free = isSeatFree(seat.seatNo, form.shiftId);
              const selected = form.seatNo === seat.seatNo;
              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!free}
                  className={`sh-seat${free ? " is-free" : " is-held"}${selected ? " is-selected" : ""}`}
                  onClick={() => patch({ seatNo: seat.seatNo })}
                >
                  {seat.seatNo}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {step === 3 && plan ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <p style={{ margin: 0 }}>
            Plan {formatInr(plan.amountPaise)} + registration {formatInr(registration)} + deposit {formatInr(deposit)}
          </p>
          <p style={{ margin: 0 }}>
            Seat {form.seatNo} · {shifts.find((s) => s.id === form.shiftId)?.name} · till {endDate}
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
            <Input
              id="adm-pay"
              inputMode="numeric"
              value={form.payingNowRupees}
              onChange={(e) => patch({ payingNowRupees: e.target.value })}
            />
          </Field>
          <Field label="Mode" htmlFor="adm-mode">
            <Select id="adm-mode" value={form.mode} onChange={(e) => patch({ mode: e.target.value })}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Bank</option>
            </Select>
          </Field>
        </div>
      ) : null}
    </Modal>
  );
}
