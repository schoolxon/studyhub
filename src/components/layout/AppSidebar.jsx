import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Armchair,
  ClipboardCheck,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { Logo } from "../brand/Logo";
import { cn } from "../../lib/utils";
import { useStore } from "../../data/StoreContext";

const navSections = [
  {
    category: "",
    items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true }],
  },
  {
    category: "Operations",
    items: [
      { to: "/app/students", label: "Students", icon: Users },
      { to: "/app/seats", label: "Seats", icon: Armchair },
      { to: "/app/attendance", label: "Attendance", icon: ClipboardCheck },
    ],
  },
  {
    category: "Billing",
    items: [
      { to: "/app/invoices", label: "Invoices", icon: Receipt },
      { to: "/app/expenses", label: "Expenses", icon: Wallet },
      { to: "/app/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    category: "System",
    items: [{ to: "/app/settings", label: "Settings", icon: Settings }],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { logout } = useStore();

  return (
    <aside
      className={cn("ui-sidebar h-full", collapsed && "collapsed")}
      style={{ width: collapsed ? 56 : 220 }}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="ui-sidebar-logo" style={{ borderBottom: "1px solid var(--neutral-200)" }}>
        <Logo to="/app" collapsed={collapsed} />
      </div>

      <div className="ui-sidebar-menu" style={{ height: "calc(100% - 140px)" }}>
        {navSections.map((section, sectionIndex) => (
          <div key={section.category || sectionIndex} style={{ marginBottom: 4 }}>
            {section.category && !collapsed ? (
              <div className="ui-sidebar-category" style={{ padding: "0 10px" }}>
                {section.category}
              </div>
            ) : null}
            {section.category && collapsed ? (
              <div
                style={{
                  height: 1,
                  backgroundColor: "var(--neutral-200)",
                  margin: "8px 6px",
                }}
              />
            ) : null}

            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.to} className="ui-sidebar-item">
                  <NavLink
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn("flex items-center gap-2", isActive && "is-active")
                    }
                    style={({ isActive }) => ({
                      padding: collapsed ? "8px 0" : "8px 10px",
                      borderRadius: 4,
                      justifyContent: collapsed ? "center" : "flex-start",
                      transition: "var(--transition-default)",
                      backgroundColor: isActive ? "var(--primary-200)" : "transparent",
                      textDecoration: "none",
                    })}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className="ui-sidebar-item-icon"
                          style={{
                            color: isActive ? "var(--primary-700)" : "var(--neutral-500)",
                          }}
                        >
                          <Icon size={16} />
                        </span>
                        {!collapsed ? (
                          <span
                            className="ui-sidebar-item-name"
                            style={{
                              color: isActive ? "var(--primary-700)" : undefined,
                            }}
                          >
                            {item.label}
                          </span>
                        ) : null}
                      </>
                    )}
                  </NavLink>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid var(--neutral-200)", padding: "8px 6px" }}>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex items-center w-full border-none bg-transparent cursor-pointer"
          style={{
            padding: collapsed ? "8px 0" : "8px 10px",
            borderRadius: 4,
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          <span className="ui-sidebar-item-icon" style={{ color: "var(--neutral-500)" }}>
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </span>
          {!collapsed ? <span className="ui-sidebar-item-name">Collapse</span> : null}
        </button>

        <button
          type="button"
          className="flex items-center w-full border-none bg-transparent cursor-pointer"
          style={{
            padding: collapsed ? "8px 0" : "8px 10px",
            borderRadius: 4,
            justifyContent: collapsed ? "center" : "flex-start",
            gap: 8,
          }}
          aria-label="Log out"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <span className="ui-sidebar-item-icon" style={{ color: "var(--destructive)" }}>
            <LogOut size={14} />
          </span>
          {!collapsed ? (
            <span style={{ color: "var(--destructive)", fontSize: 13, fontWeight: 500 }}>
              Logout
            </span>
          ) : null}
        </button>
      </div>
    </aside>
  );
}
