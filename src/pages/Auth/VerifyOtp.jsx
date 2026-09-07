import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Field, Input } from "../../components/ui/ui";

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const next = location.state?.next || "/app";
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (otp !== "123456") {
      setError("Use 123456 in this demo.");
      return;
    }
    navigate(next);
  };

  return (
    <AuthLayout title="Verify OTP" subtitle="Demo code is 123456. MSG91 is not wired.">
      <form onSubmit={submit}>
        <Field label="6-digit code" htmlFor="otp" error={error}>
          <Input
            id="otp"
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
        <Button type="submit" variant="primary" size="lg" style={{ width: "100%" }}>
          Verify
        </Button>
      </form>
      <p className="mt-8 text-center text-sm">
        <Link to="/login" className="font-semibold" style={{ color: "var(--secondary)" }}>
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}
