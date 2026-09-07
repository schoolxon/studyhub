import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, Armchair, ClipboardCheck, Receipt } from "lucide-react";

const items = [
  { to: "/app", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/app/students", label: "Students", icon: Users },
  { to: "/app/seats", label: "Seats", icon: Armchair },
  { to: "/app/attendance", label: "Attend", icon: ClipboardCheck },
  { to: "/app/invoices", label: "Bills", icon: Receipt },
];

export function MobileNav() {
  return (
    <nav className="sh-bottom-nav md:hidden" aria-label="Mobile">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => (isActive ? "is-active" : undefined)}
          >
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
