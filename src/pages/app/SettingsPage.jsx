import { Card, CardBody, CardHeader, Field, Input, PageHeader, Select } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatInr } from "../../lib/money";

export default function SettingsPage() {
  const { libraryName, branchName, graceDays, language, updateSettings, shifts, plans } = useStore();

  return (
    <div className="p-6">
      <PageHeader title="Settings" description="Saved on the tenant row in Postgres." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Branch" />
          <CardBody>
            <Field label="Library" htmlFor="set-lib">
              <Input
                id="set-lib"
                defaultValue={libraryName}
                onBlur={(e) => updateSettings({ libraryName: e.target.value, branchName, graceDays, language })}
              />
            </Field>
            <Field label="Branch" htmlFor="set-br">
              <Input
                id="set-br"
                defaultValue={branchName}
                onBlur={(e) => updateSettings({ libraryName, branchName: e.target.value, graceDays, language })}
              />
            </Field>
            <Field label="Grace days" htmlFor="set-grace">
              <Input
                id="set-grace"
                type="number"
                defaultValue={graceDays}
                onBlur={(e) =>
                  updateSettings({
                    libraryName,
                    branchName,
                    graceDays: Number(e.target.value) || 0,
                    language,
                  })
                }
              />
            </Field>
            <Field label="Language" htmlFor="set-lang">
              <Select
                id="set-lang"
                value={language}
                onChange={(e) => updateSettings({ libraryName, branchName, graceDays, language: e.target.value })}
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
                {shifts.map((shift) => (
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
          <CardHeader title="Fee plans" />
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
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{plan.name}</td>
                    <td>{plan.months}</td>
                    <td>{formatInr(plan.amountPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
