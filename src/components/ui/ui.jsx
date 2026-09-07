import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

const MODAL_WIDTH = { sm: "420px", md: "520px", lg: "700px", xl: "880px" };

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

export function Modal({ open, onClose, title, description, size = "lg", footer, children }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="ui-modal-overlay">
      <div
        className="ui-modal"
        style={{ width: MODAL_WIDTH[size] ?? MODAL_WIDTH.lg, maxWidth: "calc(100vw - 32px)" }}
        role="dialog"
        aria-modal="true"
      >
        <div className="ui-modal-header">
          <span className="ui-modal-title">{title}</span>
          <button type="button" className="ui-modal-close" onClick={onClose} aria-label="Close">
            <X size={12} style={{ color: "var(--destructive)" }} />
          </button>
        </div>
        {description ? (
          <div
            style={{
              padding: "8px 15px",
              borderBottom: "1px solid var(--neutral-200)",
              fontSize: 12,
              color: "var(--neutral-500)",
              backgroundColor: "var(--neutral-50)",
            }}
          >
            {description}
          </div>
        ) : null}
        <div className="ui-modal-body">{children}</div>
        {footer ? <div className="ui-modal-footer">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

export function PillTabs({ value, onChange, items }) {
  return (
    <div className="ui-tabs-pill" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={cn("ui-tab-pill", value === item.id && "active")}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count != null ? ` (${item.count})` : ""}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
      <div>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {description ? (
          <p style={{ margin: "4px 0 0", color: "var(--muted-foreground)" }}>{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2 flex-wrap">{actions}</div> : null}
    </div>
  );
}
