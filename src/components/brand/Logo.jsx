import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

export function Logo({ to = "/", inverted = false, collapsed = false, className }) {
  return (
    <Link
      to={to}
      className={cn("flex items-center gap-3", className)}
      style={{ textDecoration: "none" }}
    >
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 15,
          backgroundColor: inverted ? "#fff" : "var(--primary)",
          color: inverted ? "var(--sidebar)" : "#fff",
        }}
      >
        S
      </div>
      {!collapsed && (
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            letterSpacing: "-0.4px",
            color: inverted ? "#fff" : "var(--neutral-900)",
          }}
        >
          Study<span style={{ color: inverted ? "var(--btn-primary)" : "var(--primary)" }}>Hub</span>
        </span>
      )}
    </Link>
  );
}
