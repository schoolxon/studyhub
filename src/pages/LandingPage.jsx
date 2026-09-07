import { Link } from "react-router-dom";
import { Logo } from "../components/brand/Logo";
import { Button } from "../components/ui/ui";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <header
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Logo />
        <div className="flex items-center gap-2">
          <Link to="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Get started</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="ui-badge ui-badge-primary mb-4">Self-study library SaaS</p>
        <h1 style={{ marginBottom: 16 }}>Seat occupancy, attendance, and billing — without the register book</h1>
        <p style={{ fontSize: 16, color: "var(--muted-foreground)", maxWidth: 560 }}>
          StudyHub uses the same forest-green / lime design system as your civic ops apps, so staff
          screens stay familiar from login to dashboard.
        </p>
        <div className="flex gap-3 mt-8">
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
      </main>
    </div>
  );
}
