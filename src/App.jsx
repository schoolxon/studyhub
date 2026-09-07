import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { DashboardShell } from "./components/layout/DashboardShell";
import { StoreProvider } from "./data/StoreContext";
import LandingPage from "./pages/LandingPage";
import Pricing from "./pages/Pricing";
import Login from "./pages/Auth/Login";
import SignUp from "./pages/Auth/SignUp";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import VerifyOtp from "./pages/Auth/VerifyOtp";
import Home from "./pages/Home/Home";
import StudentsPage from "./pages/app/StudentsPage";
import StudentDetailPage from "./pages/app/StudentDetailPage";
import SeatsPage from "./pages/app/SeatsPage";
import AttendancePage from "./pages/app/AttendancePage";
import InvoicesPage from "./pages/app/InvoicesPage";
import SettingsPage from "./pages/app/SettingsPage";

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/app" element={<DashboardShell />}>
            <Route index element={<Home />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
            <Route path="seats" element={<SeatsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </StoreProvider>
  );
}
