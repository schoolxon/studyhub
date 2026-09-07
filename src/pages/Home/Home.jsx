import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Armchair, ClipboardCheck, IndianRupee, Users } from "lucide-react";
import { AdmissionWizard } from "../../components/admissions/AdmissionWizard";
import { RenewModal } from "../../components/billing/RenewModal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { StatCard } from "../../components/ui/StatCard";
import { Alert, Button, Card, CardBody, CardHeader, PageHeader } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatDay, membershipLabel, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";

export default function Home() {
  const navigate = useNavigate();
  const { students, invoices, payments, attendance, seats, shifts, branchName } = useStore();
  const [admitOpen, setAdmitOpen] = useState(false);
  const [renewStudent, setRenewStudent] = useState(null);
  const [flash, setFlash] = useState("");
  const today = todayIso();

  const stats = useMemo(() => {
    const morning = shifts.find((shift) => shift.code === "morning");
    const morningHeld = morning
      ? students.filter((student) => student.shiftId === morning.id).length
      : 0;
    const checkedIn = attendance.filter((row) => !row.outAt).length;
    const collected = payments
      .filter((row) => row.day === today)
      .reduce((sum, row) => sum + row.amountPaise, 0);
    return { morningHeld, checkedIn, collected, seatCount: seats.length };
  }, [attendance, payments, seats.length, shifts, students, today]);

  const expiring = useMemo(
    () =>
      students
        .map((student) => ({ student, label: membershipLabel(student.endDate, student.paused) }))
        .filter((row) => row.label === "expiring" || row.label === "overdue"),
    [students]
  );

  return (
    <div className="p-6">
      <PageHeader
        title="Dashboard"
        description="Today's occupancy and collections"
        actions={
          <>
            <span className="ui-badge ui-badge-success">Branch: {branchName}</span>
            <Button variant="primary" onClick={() => setAdmitOpen(true)}>
              New admission
            </Button>
          </>
        }
      />

      {flash ? (
        <Alert variant="success" className="mb-4">
          {flash}
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Occupied now"
          value={`${stats.morningHeld} / ${stats.seatCount}`}
          subtitle="Morning shift"
          icon={Armchair}
          onClick={() => navigate("/app/seats")}
        />
        <StatCard
          title="Active students"
          value={String(students.filter((s) => !s.paused).length)}
          icon={Users}
          iconColor="var(--secondary)"
          iconBg="var(--secondary-50)"
          onClick={() => navigate("/app/students")}
        />
        <StatCard
          title="Checked in"
          value={String(stats.checkedIn)}
          icon={ClipboardCheck}
          iconColor="var(--warning-500)"
          iconBg="var(--warning-50)"
          onClick={() => navigate("/app/attendance")}
        />
        <StatCard
          title="Today's collection"
          value={formatInr(stats.collected)}
          icon={IndianRupee}
          onClick={() => navigate("/app/invoices")}
        />
      </div>

      <Card>
        <CardHeader title="Expiring / overdue" />
        <CardBody>
          {expiring.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No memberships in the 7-day window.</p>
          ) : (
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Seat</th>
                  <th>Shift</th>
                  <th>Expires</th>
                  <th>Due</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map(({ student, label }) => {
                  const due = invoices
                    .filter((inv) => inv.studentId === student.id)
                    .reduce((sum, inv) => sum + (inv.totalPaise - inv.paidPaise), 0);
                  return (
                    <tr key={student.id} onClick={() => navigate(`/app/students/${student.id}`)}>
                      <td>{student.name}</td>
                      <td>{student.seatNo}</td>
                      <td>{shifts.find((s) => s.id === student.shiftId)?.name}</td>
                      <td>{formatDay(student.endDate)}</td>
                      <td>{formatInr(due)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={label} />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              setRenewStudent(student);
                            }}
                          >
                            Renew
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <AdmissionWizard
        open={admitOpen}
        onClose={() => setAdmitOpen(false)}
        onCreated={(created) =>
          setFlash(`${created.name} on ${created.seatNo}, valid till ${created.endDate}.`)
        }
      />
      <RenewModal open={Boolean(renewStudent)} onClose={() => setRenewStudent(null)} student={renewStudent} />
    </div>
  );
}
