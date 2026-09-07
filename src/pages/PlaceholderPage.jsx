import { Card, CardBody, CardHeader } from "../components/ui/ui";

export default function PlaceholderPage({ title, description }) {
  return (
    <div className="p-6">
      <h2 style={{ marginBottom: 8 }}>{title}</h2>
      <p style={{ color: "var(--muted-foreground)", marginBottom: 16 }}>{description}</p>
      <Card>
        <CardHeader title="Coming next" />
        <CardBody>
          <p style={{ margin: 0 }}>This screen inherits the waste_management design system (tokens + .ui-* classes).</p>
        </CardBody>
      </Card>
    </div>
  );
}
