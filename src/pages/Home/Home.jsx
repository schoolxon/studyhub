import { Users, Armchair, ClipboardCheck, IndianRupee } from "lucide-react";
import { StatCard } from "../../components/ui/StatCard";
import { Badge, Card, CardBody, CardHeader } from "../../components/ui/ui";

export default function Home() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)" }}>
            Today&apos;s occupancy and collections
          </p>
        </div>
        <Badge variant="success">Branch: Main</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard title="Occupied now" value="42 / 60" subtitle="Morning shift" icon={Armchair} trend="+6" trendUp />
        <StatCard title="Active students" value="128" icon={Users} iconColor="var(--secondary)" iconBg="var(--secondary-50)" />
        <StatCard title="Checked in" value="39" icon={ClipboardCheck} iconColor="var(--warning-500)" iconBg="var(--warning-50)" />
        <StatCard title="Today's collection" value="₹8,400" icon={IndianRupee} />
      </div>

      <Card>
        <CardHeader title="Expiring this week" />
        <CardBody>
          <table className="ui-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Seat</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Riya Sharma</td>
                <td>A-12</td>
                <td>09 Sep</td>
                <td>
                  <Badge variant="warning">Expiring</Badge>
                </td>
              </tr>
              <tr>
                <td>Aman Gupta</td>
                <td>B-04</td>
                <td>11 Sep</td>
                <td>
                  <Badge variant="warning">Expiring</Badge>
                </td>
              </tr>
              <tr>
                <td>Neha Verma</td>
                <td>C-21</td>
                <td>08 Sep</td>
                <td>
                  <Badge variant="destructive">Overdue</Badge>
                </td>
              </tr>
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
