import { cn } from "../../lib/utils";

export function Button({
  variant = "primary",
  size,
  icon = false,
  className,
  children,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        "ui-btn",
        `ui-btn-${variant}`,
        size && `ui-btn-${size}`,
        icon && "ui-btn-icon",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Input({ error, size, className, ...props }) {
  return (
    <input
      className={cn(
        "ui-input",
        size && `ui-input-${size}`,
        error && "ui-input-error",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      className={cn("ui-textarea", error && "ui-input-error", className)}
      {...props}
    />
  );
}

export function Select({ error, className, children, ...props }) {
  return (
    <select
      className={cn("ui-select", error && "ui-select-error", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, htmlFor, error, children }) {
  return (
    <div className="ui-input-group">
      {label ? <label htmlFor={htmlFor}>{label}</label> : null}
      {children}
      {error ? <span className="ui-input-error-text">{error}</span> : null}
    </div>
  );
}

export function Card({ bordered = true, highlight = false, className, children, ...props }) {
  return (
    <div
      className={cn(
        bordered ? "ui-card-bordered" : "ui-card",
        highlight && "ui-card-highlight",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, children, className }) {
  return (
    <div className={cn("ui-card-header", className)}>
      {title ? <span className="ui-card-header-title">{title}</span> : children}
    </div>
  );
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn("ui-card-body", className)} {...props}>
      {children}
    </div>
  );
}

export function Badge({ variant = "primary", className, children, ...props }) {
  return (
    <span className={cn("ui-badge", `ui-badge-${variant}`, className)} {...props}>
      {children}
    </span>
  );
}

export function Alert({ variant = "info", className, children, ...props }) {
  return (
    <div className={cn("ui-alert", `ui-alert-${variant}`, className)} {...props}>
      {children}
    </div>
  );
}

export function Checkbox({ label, className, id, ...props }) {
  const input = (
    <input id={id} type="checkbox" className={cn("ui-checkbox", className)} {...props} />
  );
  if (!label) return input;
  return (
    <label className="ui-checkbox-label" htmlFor={id}>
      {input}
      {label}
    </label>
  );
}
