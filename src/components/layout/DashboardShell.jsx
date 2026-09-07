import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";

export function DashboardShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block h-full">
        <AppSidebar />
      </div>
      <main
        className="flex-1 overflow-y-auto pb-16 md:pb-0"
        style={{ background: "var(--background)" }}
      >
        <div className="sh-demo-banner">Demo shell — in-memory data, no API. Resets on refresh.</div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
