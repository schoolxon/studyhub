import { cn } from "../../lib/utils";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "var(--primary)",
  iconBg = "var(--primary-50)",
  trend,
  trendUp,
  className,
  onClick,
}) {
  return (
    <div
      className={cn("ui-card-bordered", onClick && "cursor-pointer", className)}
      style={{ padding: 20, transition: "box-shadow 0.2s ease" }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) e.currentTarget.style.boxShadow = "var(--shadow-md)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center justify-center"
          style={{
            width: 40,
            height: 40,
            borderRadius: 8,
            background: iconBg,
            color: iconColor,
          }}
        >
          {Icon ? <Icon size={20} /> : null}
        </div>
        {trend ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: trendUp ? "var(--success)" : "var(--destructive)",
            }}
          >
            {trend}
          </span>
        ) : null}
      </div>
      <p
        style={{
          fontSize: 24,
          fontWeight: 700,
          lineHeight: 1.2,
          color: "var(--foreground)",
          margin: 0,
        }}
      >
        {value}
      </p>
      <p
        style={{
          fontSize: 13,
          color: "var(--muted-foreground)",
          margin: "4px 0 0",
        }}
      >
        {title}
      </p>
      {subtitle ? (
        <p
          style={{
            fontSize: 12,
            color: "var(--muted-foreground)",
            margin: "4px 0 0",
          }}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
