import { Badge } from "./ui";

const VARIANT = {
  active: "success",
  expiring: "warning",
  overdue: "destructive",
  paused: "secondary",
  paid: "success",
  partial: "warning",
  open: "primary",
};

export function StatusBadge({ status }) {
  return <Badge variant={VARIANT[status] || "neutral"}>{status}</Badge>;
}
