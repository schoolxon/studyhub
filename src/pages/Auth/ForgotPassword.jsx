import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Field, Input } from "../../components/ui/ui";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (!mobile.trim()) {
      setError("Mobile is required");
      return;
    }
    navigate("/verify-otp", { state: { mobile, next: "/login" } });
  };

  return (
    <AuthLayout title="Reset password" subtitle="We'll send a demo OTP. No SMS is actually fired.">
      <form onSubmit={submit}>
        <Field label="Mobile" htmlFor="fp-mobile" error={error}>
          <Input
            id="fp-mobile"
            inputMode="numeric"
            size="lg"
            value={mobile}
            error={Boolean(error)}
            onChange={(e) => {
              setMobile(e.target.value);
              setError("");
            }}
          />
        </Field>
        <Button type="submit" variant="primary" size="lg" style={{ width: "100%" }}>
          Send OTP
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
