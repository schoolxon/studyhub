import { useMemo, useState } from "react";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { Button, Input, PageHeader } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { membershipLabel } from "../../lib/dates";

export default function AttendancePage() {
  const { students, attendance, checkIn, checkOut, shifts } = useStore();
  const [query, setQuery] = useState("");

  const openByStudent = useMemo(() => {
    const map = new Map();
    for (const row of attendance) {
      if (!row.outAt) map.set(row.studentId, row);
    }
    return map;
  }, [attendance]);

  const rows = students.filter((student) => {
    if (student.paused) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${student.name} ${student.mobile} ${student.seatNo}`.toLowerCase().includes(q);
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Attendance"
        description={`${openByStudent.size} open sessions. QR scanner is not in this Vite shell.`}
      />
      <Input
        placeholder="Find student"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 16 }}
      />
      <table className="ui-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Seat</th>
            <th>Shift</th>
            <th>Status</th>
            <th>Session</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((student) => {
            const open = openByStudent.get(student.id);
            return (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.seatNo}</td>
                <td>{shifts.find((s) => s.id === student.shiftId)?.name}</td>
                <td>
                  <StatusBadge status={membershipLabel(student.endDate, student.paused)} />
                </td>
                <td>
                  {open ? (
                    <Button variant="outline" size="sm" onClick={() => checkOut(student.id)}>
                      Check out
                    </Button>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => checkIn(student.id)}>
                      Check in
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
