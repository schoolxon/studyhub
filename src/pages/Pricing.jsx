import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo";
import { Button, Card, CardBody, CardHeader } from "../components/ui/ui";
import { formatInr } from "../lib/money";

const PLANS = [
  { name: "Starter", monthly: 49_900, seats: "Up to 100 students" },
  { name: "Growth", monthly: 99_900, seats: "Up to 250 students" },
  { name: "Pro", monthly: 199_900, seats: "Up to 500 students" },
  { name: "White label", monthly: 499_900, seats: "Your brand + ₹15,000 setup" },
];

export default function Pricing() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Logo />
        <Link to="/signup">
          <Button variant="primary">Start 14-day trial</Button>
        </Link>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="ui-badge ui-badge-primary mb-3">GST extra 18%</p>
        <h1 style={{ marginTop: 0 }}>Simple monthly plans for one library or a chain</h1>
        <p style={{ color: "var(--muted-foreground)", maxWidth: 560 }}>
          List prices match the StudyHub plan. GST is extra 18%. Checkout is not live.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-10">
          {PLANS.map((plan) => (
            <Card key={plan.name} highlight={plan.name === "Growth"}>
              <CardHeader title={plan.name} />
              <CardBody>
                <p style={{ fontSize: 28, fontWeight: 700, margin: "0 0 8px" }}>{formatInr(plan.monthly)}</p>
                <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  / month, ex-GST
                </p>
                <p>{plan.seats}</p>
                <Link to="/signup">
                  <Button variant={plan.name === "Growth" ? "primary" : "outline"} style={{ width: "100%" }}>
                    Choose
                  </Button>
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
