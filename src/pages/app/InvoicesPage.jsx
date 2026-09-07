import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CollectPaymentModal } from "../../components/billing/CollectPaymentModal";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button, PageHeader, PillTabs } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatDay, todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";

export default function InvoicesPage() {
  const { invoices, payments, students } = useStore();
  const [tab, setTab] = useState("dues");
  const [collectStudent, setCollectStudent] = useState(null);
  const today = todayIso();

  const studentById = useMemo(
    () => Object.fromEntries(students.map((s) => [s.id, s])),
    [students]
  );

  const dues = invoices.filter((inv) => inv.paidPaise < inv.totalPaise);
  const todayPay = payments.filter((row) => row.day === today);
  const todayTotal = todayPay.reduce((sum, row) => sum + row.amountPaise, 0);

  return (
    <div className="p-6">
      <PageHeader
        title="Invoices & collections"
        description={`Today ${formatInr(todayTotal)}. Print a receipt from today's collections.`}
      />
      <PillTabs
        value={tab}
        onChange={setTab}
        items={[
          { id: "dues", label: "Due", count: dues.length },
          { id: "all", label: "All invoices", count: invoices.length },
          { id: "today", label: "Today", count: todayPay.length },
        ]}
      />

      {tab === "today" ? (
        <table className="ui-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Student</th>
              <th>Mode</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {todayPay.map((row) => (
              <tr key={row.id}>
                <td>{row.at.replace("T", " ").slice(11, 19)}</td>
                <td>{studentById[row.studentId]?.name || row.studentId}</td>
                <td>{row.mode}</td>
                <td>{formatInr(row.amountPaise)}</td>
                <td>
                  <Link to={`/app/receipts/${row.id}`} style={{ color: "var(--secondary)" }}>
                    Print
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className="ui-table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student</th>
              <th>Issued</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(tab === "dues" ? dues : invoices).map((inv) => {
              const student = studentById[inv.studentId];
              const due = inv.totalPaise - inv.paidPaise;
              return (
                <tr key={inv.id}>
                  <td>{inv.number}</td>
                  <td>{student?.name || inv.studentId}</td>
                  <td>{formatDay(inv.issuedOn)}</td>
                  <td>{formatInr(inv.totalPaise)}</td>
                  <td>{formatInr(inv.paidPaise)}</td>
                  <td>
                    <StatusBadge status={inv.status} />
                  </td>
                  <td>
                    {due > 0 && student ? (
                      <Button variant="primary" size="sm" onClick={() => setCollectStudent(student)}>
                        Collect
                      </Button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <CollectPaymentModal
        open={Boolean(collectStudent)}
        onClose={() => setCollectStudent(null)}
        student={collectStudent}
      />
    </div>
  );
}
