import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AdmissionWizard } from "../../components/admissions/AdmissionWizard";
import { CollectPaymentModal } from "../../components/billing/CollectPaymentModal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button, Input, PageHeader, PillTabs } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatDay, membershipLabel } from "../../lib/dates";
import { formatInr } from "../../lib/money";

export default function StudentsPage() {
  const navigate = useNavigate();
  const { students, invoices, shifts } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [admitOpen, setAdmitOpen] = useState(false);
  const [collectStudent, setCollectStudent] = useState(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .map((student) => {
        const due = invoices
          .filter((inv) => inv.studentId === student.id)
          .reduce((sum, inv) => sum + (inv.totalPaise - inv.paidPaise), 0);
        return { student, due, label: membershipLabel(student.endDate, student.paused) };
      })
      .filter((row) => {
        if (filter !== "all" && row.label !== filter) return false;
        if (!q) return true;
        const hay = `${row.student.name} ${row.student.mobile} ${row.student.seatNo}`.toLowerCase();
        return hay.includes(q);
      });
  }, [filter, invoices, query, students]);

  const counts = useMemo(() => {
    const labels = students.map((s) => membershipLabel(s.endDate, s.paused));
    return {
      all: students.length,
      expiring: labels.filter((x) => x === "expiring").length,
      overdue: labels.filter((x) => x === "overdue").length,
      paused: labels.filter((x) => x === "paused").length,
    };
  }, [students]);

  return (
    <div className="p-6">
      <PageHeader
        title="Students"
        description="Search-first roster. Admission is local demo state."
        actions={
          <Button variant="primary" onClick={() => setAdmitOpen(true)}>
            New admission
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <Input
          placeholder="Name, mobile, or seat"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ maxWidth: 360 }}
        />
        <PillTabs
          value={filter}
          onChange={setFilter}
          items={[
            { id: "all", label: "All", count: counts.all },
            { id: "expiring", label: "Expiring", count: counts.expiring },
            { id: "overdue", label: "Overdue", count: counts.overdue },
            { id: "paused", label: "Paused", count: counts.paused },
          ]}
        />
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {rows.map(({ student, due, label }) => (
          <button
            key={student.id}
            type="button"
            className="ui-card-bordered text-left"
            style={{ padding: 16 }}
            onClick={() => navigate(`/app/students/${student.id}`)}
          >
            <div className="flex items-start justify-between gap-2">
              <strong>{student.name}</strong>
              <StatusBadge status={label} />
            </div>
            <p style={{ margin: "6px 0 0", color: "var(--muted-foreground)", fontSize: 13 }}>
              {student.seatNo} · {shifts.find((s) => s.id === student.shiftId)?.name} · till {formatDay(student.endDate)}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>Due {formatInr(due)}</p>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Mobile</th>
              <th>Seat</th>
              <th>Shift</th>
              <th>Expires</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ student, due, label }) => (
              <tr key={student.id} onClick={() => navigate(`/app/students/${student.id}`)}>
                <td>{student.name}</td>
                <td>{student.mobile}</td>
                <td>{student.seatNo}</td>
                <td>{shifts.find((s) => s.id === student.shiftId)?.name}</td>
                <td>{formatDay(student.endDate)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    {formatInr(due)}
                    {due > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCollectStudent(student);
                        }}
                      >
                        Collect
                      </Button>
                    ) : null}
                  </div>
                </td>
                <td>
                  <StatusBadge status={label} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <p style={{ color: "var(--muted-foreground)", marginTop: 16 }}>No students match that search.</p>
      ) : null}

      <AdmissionWizard open={admitOpen} onClose={() => setAdmitOpen(false)} />
      <CollectPaymentModal
        open={Boolean(collectStudent)}
        onClose={() => setCollectStudent(null)}
        student={collectStudent}
      />
    </div>
  );
}
