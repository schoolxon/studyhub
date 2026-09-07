import { Link } from "react-router-dom";
import { Armchair, ClipboardCheck, IndianRupee } from "lucide-react";
import { Logo } from "../components/brand/Logo";
import { Button, Card, CardBody } from "../components/ui/ui";

const features = [
  { icon: Armchair, title: "Seat occupancy", body: "Shift-wise map so you stop arguing over who sits where." },
  { icon: ClipboardCheck, title: "Attendance", body: "Check-in / check-out without a paper register." },
  { icon: IndianRupee, title: "Billing", body: "Invoices in paise, FIFO collection, GST-ready copy." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/pricing">
            <Button variant="ghost">Pricing</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <p className="ui-badge ui-badge-primary mb-4">Self-study library SaaS</p>
        <h1 style={{ marginBottom: 16, maxWidth: 720 }}>
          Seat occupancy, attendance, and billing — without the register book
        </h1>
        <p style={{ fontSize: 16, color: "var(--muted-foreground)", maxWidth: 560 }}>
          Owner desk for seats, admissions, attendance, and collections. Vite UI talks to a Fastify
          API on Postgres with FORCE RLS. Nest+Next remains a later rewrite if we outgrow this stack.
        </p>
        <div className="flex gap-3 mt-8 flex-wrap">
          <Link to="/signup">
            <Button variant="primary" size="lg">
              Create library
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="lg">
              Owner login
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-16">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardBody>
                  <Icon size={20} style={{ color: "var(--primary)" }} />
                  <h3 style={{ margin: "12px 0 8px" }}>{feature.title}</h3>
                  <p style={{ margin: 0, color: "var(--muted-foreground)" }}>{feature.body}</p>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
