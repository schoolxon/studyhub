import { Navigate, Outlet } from "react-router-dom";
import { getToken } from "../../lib/api";
import { useStore } from "../../data/StoreContext";

export function ProtectedRoute() {
  const { ready } = useStore();
  if (!getToken()) return <Navigate to="/login" replace />;
  if (!ready) {
    return (
      <div className="p-8" style={{ color: "var(--muted-foreground)" }}>
        Loading library…
      </div>
    );
  }
  return <Outlet />;
}
