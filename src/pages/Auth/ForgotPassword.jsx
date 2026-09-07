import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Field, Input } from "../../components/ui/ui";
import { api } from "../../lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const sendOtp = async (event) => {
    event.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/v1/auth/forgot", { method: "POST", body: { email } });
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    if (!otp.trim() || !password) {
      setError("OTP and new password are required");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/v1/auth/reset", { method: "POST", body: { email, otp, password } });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle={
        step === "email"
          ? "We'll store a demo OTP. No SMS is sent until you paste MSG91 keys in Settings."
          : "Demo code is 123456. MSG91 is not wired yet."
      }
    >
      {step === "email" ? (
        <form onSubmit={sendOtp}>
          <Field label="Email" htmlFor="fp-email" error={error}>
            <Input
              id="fp-email"
              type="email"
              size="lg"
              value={email}
              error={Boolean(error)}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Sending…" : "Send OTP"}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword}>
          <Field label="6-digit code" htmlFor="fp-otp" error={error}>
            <Input
              id="fp-otp"
              inputMode="numeric"
              size="lg"
              maxLength={6}
              value={otp}
              error={Boolean(error)}
              onChange={(e) => {
                setOtp(e.target.value);
                setError("");
              }}
            />
          </Field>
          <Field label="New password" htmlFor="fp-pass">
            <Input
              id="fp-pass"
              type="password"
              size="lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Saving…" : "Reset password"}
          </Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm">
        <Link to="/login" className="font-semibold" style={{ color: "var(--secondary)" }}>
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
