import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { MobileNav } from "./MobileNav";
import { useStore } from "../../data/StoreContext";

export function DashboardShell() {
  const { libraryName, branchName, bootError } = useStore();
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden md:block h-full">
        <AppSidebar />
      </div>
      <main
        className="flex-1 overflow-y-auto pb-16 md:pb-0"
        style={{ background: "var(--background)" }}
      >
        <div className="sh-demo-banner">
          {bootError
            ? `API error: ${bootError}`
            : `${libraryName || "StudyHub"} · ${branchName} · Postgres (data persists)`}
        </div>
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
