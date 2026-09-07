import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";

export function DashboardShell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: "var(--background)" }}>
        <Outlet />
      </main>
    </div>
  );
}
