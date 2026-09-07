import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./components/layout/DashboardShell";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import Home from "./pages/Home/Home";
import PlaceholderPage from "./pages/PlaceholderPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/app" element={<DashboardShell />}>
          <Route index element={<Home />} />
          <Route
            path="students"
            element={<PlaceholderPage title="Students" description="Roster, plans, and seat assignment." />}
          />
          <Route
            path="seats"
            element={<PlaceholderPage title="Seats" description="Floor map, shifts, and occupancy." />}
          />
          <Route
            path="attendance"
            element={<PlaceholderPage title="Attendance" description="Check-in / check-out for today." />}
          />
          <Route
            path="invoices"
            element={<PlaceholderPage title="Invoices" description="GST invoices and collections." />}
          />
          <Route
            path="settings"
            element={<PlaceholderPage title="Settings" description="Branch, shifts, and billing defaults." />}
          />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
