import { Logo } from "../brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  features = [
    "Live seat occupancy by shift",
    "Monthly billing and GST invoices",
    "Attendance and expiry reminders",
  ],
  headline = "Run your self-study library from one desk",
  description = "Track seats, students, and payments without WhatsApp chaos or paper registers.",
  children,
}) {
  return (
    <main className="flex min-h-screen w-full">
      <section
        className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative overflow-hidden"
        style={{ background: "var(--sidebar)" }}
      >
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full border-4 border-white" />
          <div className="absolute top-1/2 -left-40 w-64 h-64 rounded-full border-2 border-white" />
        </div>

        <div className="relative z-10">
          <Logo inverted to="/" />
        </div>

        <div className="relative z-10 max-w-lg">
          <h1 className="text-white leading-tight mb-5" style={{ fontSize: 36, color: "#fff" }}>
            {headline}
          </h1>
          <p className="text-sm mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            {description}
          </p>
          <ul className="space-y-4" style={{ padding: 0, margin: 0, listStyle: "none" }}>
            {features.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-white">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{ background: "var(--btn-primary)", color: "var(--btn-primary-fg)" }}
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div />
      </section>

      <section
        className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-16"
        style={{ background: "var(--background)" }}
      >
        <div className="w-full max-w-sm">
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <Logo to="/" />
          </div>

          <div className="mb-8">
            <h2 style={{ color: "var(--foreground)", marginBottom: 4 }}>{title}</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              {subtitle}
            </p>
          </div>

          {children}
        </div>
      </section>
    </main>
  );
}
