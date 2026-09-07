import { useState } from "react";
import { Card, CardBody, CardHeader, Field, Input, PageHeader, Select, Button, Alert } from "../../components/ui/ui";
import { useStore } from "../../data/StoreContext";
import { formatInr } from "../../lib/money";

function hintText(status) {
  if (!status?.configured) return "Leave empty until you have the key. Saving a blank field keeps whatever is already stored.";
  return `Saved ${status.hint}. Leave blank to keep it, or paste a new value to replace.`;
}

export default function SettingsPage() {
  const {
    libraryName,
    branchName,
    graceDays,
    language,
    gstin,
    integrations,
    updateSettings,
    shifts,
    plans,
  } = useStore();
  const [keys, setKeys] = useState({
    msg91AuthKey: "",
    msg91Sender: "",
    razorpayKeyId: "",
    razorpayKeySecret: "",
    whatsappToken: "",
    whatsappPhoneId: "",
  });
  const [keyNotice, setKeyNotice] = useState("");
  const [keyError, setKeyError] = useState("");
  const [savingKeys, setSavingKeys] = useState(false);

  const setKey = (field) => (event) => {
    setKeys((prev) => ({ ...prev, [field]: event.target.value }));
    setKeyNotice("");
    setKeyError("");
  };

  const saveKeys = async (event) => {
    event.preventDefault();
    const integrationsPatch = {};
    for (const [field, value] of Object.entries(keys)) {
      if (String(value).trim()) integrationsPatch[field] = String(value).trim();
    }
    if (Object.keys(integrationsPatch).length === 0) {
      setKeyError("Paste at least one key to save. Blank fields are ignored so existing keys stay put.");
      return;
    }
    setSavingKeys(true);
    try {
      await updateSettings({ integrations: integrationsPatch });
      setKeys({
        msg91AuthKey: "",
        msg91Sender: "",
        razorpayKeyId: "",
        razorpayKeySecret: "",
        whatsappToken: "",
        whatsappPhoneId: "",
      });
      setKeyNotice("Keys saved. SMS, Razorpay, and WhatsApp stay off until you use them later.");
    } catch (error) {
      setKeyError(error.message);
    } finally {
      setSavingKeys(false);
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Settings" description="Library details stay on the tenant row. Provider keys can be pasted later — they are stored, not used yet." />

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
            <Field label="GSTIN" htmlFor="set-gstin">
              <Input
                id="set-gstin"
                defaultValue={gstin}
                placeholder="Optional"
                onBlur={(e) => updateSettings({ gstin: e.target.value })}
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
          <CardHeader title="Integrations" />
          <CardBody>
            <p style={{ marginTop: 0, color: "var(--muted-foreground)" }}>
              Paste MSG91, Razorpay, and WhatsApp keys here when you have them. StudyHub will not send SMS or take online payments until those flows are wired. Cash and UPI-as-mode still work.
            </p>
            {keyNotice ? <Alert variant="success">{keyNotice}</Alert> : null}
            {keyError ? <Alert variant="error">{keyError}</Alert> : null}
            <form onSubmit={saveKeys} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="MSG91 auth key" htmlFor="int-msg91-key">
                <Input
                  id="int-msg91-key"
                  type="password"
                  autoComplete="off"
                  value={keys.msg91AuthKey}
                  placeholder={integrations.msg91AuthKey?.configured ? integrations.msg91AuthKey.hint : "Paste later"}
                  onChange={setKey("msg91AuthKey")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.msg91AuthKey)}
                </span>
              </Field>
              <Field label="MSG91 sender ID" htmlFor="int-msg91-sender">
                <Input
                  id="int-msg91-sender"
                  value={keys.msg91Sender}
                  placeholder={integrations.msg91Sender?.configured ? integrations.msg91Sender.hint : "e.g. STDYHB"}
                  onChange={setKey("msg91Sender")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.msg91Sender)}
                </span>
              </Field>
              <Field label="Razorpay key ID" htmlFor="int-rzp-id">
                <Input
                  id="int-rzp-id"
                  autoComplete="off"
                  value={keys.razorpayKeyId}
                  placeholder={integrations.razorpayKeyId?.configured ? integrations.razorpayKeyId.hint : "rzp_live_…"}
                  onChange={setKey("razorpayKeyId")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.razorpayKeyId)}
                </span>
              </Field>
              <Field label="Razorpay key secret" htmlFor="int-rzp-secret">
                <Input
                  id="int-rzp-secret"
                  type="password"
                  autoComplete="off"
                  value={keys.razorpayKeySecret}
                  placeholder={integrations.razorpayKeySecret?.configured ? integrations.razorpayKeySecret.hint : "Paste later"}
                  onChange={setKey("razorpayKeySecret")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.razorpayKeySecret)}
                </span>
              </Field>
              <Field label="WhatsApp token" htmlFor="int-wa-token">
                <Input
                  id="int-wa-token"
                  type="password"
                  autoComplete="off"
                  value={keys.whatsappToken}
                  placeholder={integrations.whatsappToken?.configured ? integrations.whatsappToken.hint : "Paste later"}
                  onChange={setKey("whatsappToken")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.whatsappToken)}
                </span>
              </Field>
              <Field label="WhatsApp phone number ID" htmlFor="int-wa-phone">
                <Input
                  id="int-wa-phone"
                  value={keys.whatsappPhoneId}
                  placeholder={integrations.whatsappPhoneId?.configured ? integrations.whatsappPhoneId.hint : "Meta Cloud API phone ID"}
                  onChange={setKey("whatsappPhoneId")}
                />
                <span className="ui-input-error-text" style={{ color: "var(--muted-foreground)" }}>
                  {hintText(integrations.whatsappPhoneId)}
                </span>
              </Field>
              <div className="md:col-span-2">
                <Button type="submit" variant="primary" disabled={savingKeys}>
                  {savingKeys ? "Saving…" : "Save keys"}
                </Button>
              </div>
            </form>
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
