import { useState } from "react";
import { PageHeader } from "../../components/ui/ui";
import { COLS, ROWS, SHIFTS, allSeats, seatNo } from "../../data/seed";
import { useStore } from "../../data/StoreContext";

export default function SeatsPage() {
  const { students } = useStore();
  const [shiftId, setShiftId] = useState("morning");
  const total = allSeats().length;
  const held = students.filter((s) => s.shiftId === shiftId);
  const occupant = (no) => held.find((s) => s.seatNo === no);

  return (
    <div className="p-6">
      <PageHeader
        title="Seat map"
        description={`${held.length} / ${total} held this shift. Click a held seat to see the student.`}
      />
      <div className="flex flex-wrap gap-2 mb-4">
        {SHIFTS.map((shift) => (
          <button
            key={shift.id}
            type="button"
            className={`ui-tab-pill${shiftId === shift.id ? " active" : ""}`}
            onClick={() => setShiftId(shift.id)}
          >
            {shift.name}
            <span style={{ opacity: 0.8 }}> {shift.hours}</span>
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        <span className="inline-flex items-center gap-2">
          <i className="sh-seat is-free" style={{ width: 16, height: 16, fontSize: 0 }} /> Free
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="sh-seat is-held" style={{ width: 16, height: 16, fontSize: 0 }} /> Held
        </span>
        <span className="inline-flex items-center gap-2">
          <i className="sh-seat is-paused" style={{ width: 16, height: 16, fontSize: 0 }} /> Paused (still held)
        </span>
      </div>
      <div className="sh-seat-grid">
        {ROWS.map((row) =>
          Array.from({ length: COLS }, (_, index) => {
            const no = seatNo(row, index + 1);
            const student = occupant(no);
            return (
              <div
                key={no}
                className={`sh-seat${student ? (student.paused ? " is-paused" : " is-held") : " is-free"}`}
                title={student ? `${student.name} · ${student.mobile}` : `${no} free`}
              >
                {no}
                {student ? <span>{student.name.split(" ")[0]}</span> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
