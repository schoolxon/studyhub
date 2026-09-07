import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardBody, CardHeader, Field, Input, PageHeader, Alert } from "../../components/ui/ui";
import { StatCard } from "../../components/ui/StatCard";
import { api } from "../../lib/api";
import { todayIso } from "../../lib/dates";
import { formatInr } from "../../lib/money";
import { IndianRupee, Wallet, TrendingUp, Users } from "lucide-react";

function defaultFrom() {
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - 29);
  return todayIso(cursor);
}

export default function ReportsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(todayIso);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api(`/v1/reports?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((data) => {
        if (!cancelled) {
          setReport(data.report);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  return (
    <div className="p-6">
      <PageHeader
        title="Reports"
        description="Collection, dues, admissions, and a simple profit view for the selected dates."
        actions={
          <div className="flex items-end gap-2 flex-wrap">
            <Field label="From" htmlFor="rep-from">
              <Input id="rep-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </Field>
            <Field label="To" htmlFor="rep-to">
              <Input id="rep-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </Field>
          </div>
        }
      />

      {error ? <Alert variant="error">{error}</Alert> : null}
      {loading && !report ? <p style={{ color: "var(--muted-foreground)" }}>Loading…</p> : null}

      {report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard title="Collected" value={formatInr(report.collectedPaise)} icon={IndianRupee} />
            <StatCard title="Expenses" value={formatInr(report.expensePaise)} icon={Wallet} />
            <StatCard title="Profit" value={formatInr(report.profitPaise)} icon={TrendingUp} />
            <StatCard
              title="Open dues"
              value={formatInr(report.duesPaise)}
              subtitle={`${report.dues.length} students`}
              icon={Users}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="Collection by mode" />
              <CardBody>
                {report.collection.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No receipts in this range.</p>
                ) : (
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>Count</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.collection.map((row) => (
                        <tr key={row.mode}>
                          <td>{row.mode}</td>
                          <td>{row.count}</td>
                          <td>{formatInr(row.totalPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Admissions" />
              <CardBody>
                {report.admissions.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No new students in this range.</p>
                ) : (
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Seat</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.admissions.map((row) => (
                        <tr key={row.studentId}>
                          <td>
                            <Link to={`/app/students/${row.studentId}`} style={{ color: "var(--secondary)" }}>
                              {row.name}
                            </Link>
                          </td>
                          <td>{row.seatNo || "—"}</td>
                          <td>{row.joinedOn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader title="Students with dues" />
              <CardBody>
                {report.dues.length === 0 ? (
                  <p style={{ margin: 0, color: "var(--muted-foreground)" }}>No open dues.</p>
                ) : (
                  <table className="ui-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Mobile</th>
                        <th>Seat</th>
                        <th>Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.dues.map((row) => (
                        <tr key={row.studentId}>
                          <td>
                            <Link to={`/app/students/${row.studentId}`} style={{ color: "var(--secondary)" }}>
                              {row.name}
                            </Link>
                          </td>
                          <td>{row.mobile}</td>
                          <td>{row.seatNo || "—"}</td>
                          <td>{formatInr(row.duePaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
