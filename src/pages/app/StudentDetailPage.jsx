import { useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { CollectPaymentModal } from "../../components/billing/CollectPaymentModal";
import { RenewModal } from "../../components/billing/RenewModal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button, Card, CardBody, CardHeader, PageHeader } from "../../components/ui/ui";
import { PLANS, SHIFTS } from "../../data/seed";
import { useStore } from "../../data/StoreContext";
import { formatDay, membershipLabel } from "../../lib/dates";
import { formatInr } from "../../lib/money";

export default function StudentDetailPage() {
  const { id } = useParams();
  const { students, invoices, attendance, togglePause } = useStore();
  const student = students.find((item) => item.id === id);
  const [tab, setTab] = useState("profile");
  const [collectOpen, setCollectOpen] = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);

  const due = useMemo(() => {
    if (!student) return 0;
    return invoices
      .filter((inv) => inv.studentId === student.id)
      .reduce((sum, inv) => sum + (inv.totalPaise - inv.paidPaise), 0);
  }, [invoices, student]);

  if (!student) return <Navigate to="/app/students" replace />;

  const label = membershipLabel(student.endDate, student.paused);
  const plan = PLANS.find((item) => item.id === student.planId);
  const bills = invoices.filter((inv) => inv.studentId === student.id);
  const visits = attendance.filter((row) => row.studentId === student.id);

  return (
    <div className="p-6">
      <p className="text-sm mb-3">
        <Link to="/app/students" style={{ color: "var(--secondary)" }}>
          Students
        </Link>
        <span style={{ color: "var(--muted-foreground)" }}> / {student.name}</span>
      </p>
      <PageHeader
        title={student.name}
        description={`${student.seatNo} · ${SHIFTS.find((s) => s.id === student.shiftId)?.name} · ${student.mobile}`}
        actions={
          <>
            <StatusBadge status={label} />
            <Button variant="outline" onClick={() => togglePause(student.id)}>
              {student.paused ? "Resume" : "Pause"}
            </Button>
            <Button variant="outline" onClick={() => setRenewOpen(true)}>
              Renew
            </Button>
            <Button variant="primary" onClick={() => setCollectOpen(true)} disabled={due <= 0}>
              Collect {formatInr(due)}
            </Button>
          </>
        }
      />

      <div className="ui-tabs-underline mb-4">
        {[
          ["profile", "Profile"],
          ["bills", "Invoices"],
          ["visits", "Attendance"],
        ].map(([id, labelText]) => (
          <button
            key={id}
            type="button"
            className={`ui-tab-underline${tab === id ? " active" : ""}`}
            onClick={() => setTab(id)}
          >
            {labelText}
          </button>
        ))}
      </div>

      {tab === "profile" ? (
        <Card>
          <CardHeader title="Membership" />
          <CardBody>
            <p>Plan {plan?.name} · {formatDay(student.startDate)} – {formatDay(student.endDate)}</p>
            <p>Guardian {student.guardian || "—"}</p>
            <p style={{ color: "var(--muted-foreground)", marginBottom: 0 }}>
              Seat change and leave/settlement stay Nest+Postgres work (Q-01).
            </p>
          </CardBody>
        </Card>
      ) : null}

      {tab === "bills" ? (
        <table className="ui-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Issued</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.number}</td>
                <td>{formatDay(inv.issuedOn)}</td>
                <td>{formatInr(inv.totalPaise)}</td>
                <td>{formatInr(inv.paidPaise)}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {tab === "visits" ? (
        visits.length === 0 ? (
          <p style={{ color: "var(--muted-foreground)" }}>No visits yet today.</p>
        ) : (
          <table className="ui-table">
            <thead>
              <tr>
                <th>In</th>
                <th>Out</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((row) => (
                <tr key={row.id}>
                  <td>{row.inAt.replace("T", " ")}</td>
                  <td>{row.outAt ? row.outAt.replace("T", " ") : "Open"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      ) : null}

      <CollectPaymentModal open={collectOpen} onClose={() => setCollectOpen(false)} student={student} />
      <RenewModal open={renewOpen} onClose={() => setRenewOpen(false)} student={student} />
    </div>
  );
}
