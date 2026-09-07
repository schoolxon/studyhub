import { Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "../../components/ui/ui";
import { PLANS, SHIFTS } from "../../data/seed";
import { useStore } from "../../data/StoreContext";
import { formatInr } from "../../lib/money";

export default function SettingsPage() {
  const { libraryName, branchName, graceDays, language, updateSettings } = useStore();

  return (
    <div className="p-6">
      <PageHeader title="Settings" description="Demo fields only. SaaS billing and staff RBAC wait for Nest." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Branch" />
          <CardBody>
            <Field label="Library" htmlFor="set-lib">
              <Input
                id="set-lib"
                value={libraryName}
                onChange={(e) => updateSettings({ libraryName: e.target.value })}
              />
            </Field>
            <Field label="Branch" htmlFor="set-br">
              <Input
                id="set-br"
                value={branchName}
                onChange={(e) => updateSettings({ branchName: e.target.value })}
              />
            </Field>
            <Field label="Grace days" htmlFor="set-grace">
              <Input
                id="set-grace"
                type="number"
                value={graceDays}
                onChange={(e) => updateSettings({ graceDays: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Language" htmlFor="set-lang">
              <Select
                id="set-lang"
                value={language}
                onChange={(e) => updateSettings({ language: e.target.value })}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
              </Select>
            </Field>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Shifts" />
          <CardBody>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Hours</th>
                </tr>
              </thead>
              <tbody>
                {SHIFTS.map((shift) => (
                  <tr key={shift.id}>
                    <td>{shift.name}</td>
                    <td>{shift.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Fee plans (paise)" />
          <CardBody>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>Months</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {PLANS.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.name}</td>
                    <td>{plan.months}</td>
                    <td>{formatInr(plan.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm" style={{ color: "var(--muted-foreground)", marginBottom: 0 }}>
              CRUD against Postgres is Sprint 2 after Q-01.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
