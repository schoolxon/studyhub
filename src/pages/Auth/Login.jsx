import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Field, Input } from "../../components/ui/ui";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!email) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setLoading(true);
    window.setTimeout(() => {
      setLoading(false);
      navigate("/app");
    }, 400);
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Login to manage seats, students, and billing."
    >
      <form onSubmit={handleLogin}>
        <Field label="Email Address" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            size="lg"
            placeholder="name@example.com"
            value={email}
            error={Boolean(errors.email)}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password}>
          <div className="ui-password-wrap">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              size="lg"
              placeholder="••••••••"
              value={password}
              error={Boolean(errors.password)}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            <button
              type="button"
              className="ui-password-toggle"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <div style={{ paddingTop: 8 }}>
          <Button type="submit" variant="primary" size="lg" disabled={loading} style={{ width: "100%" }}>
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </div>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        Don&apos;t have an account?{" "}
        <Link to="/signup" className="font-semibold hover:underline" style={{ color: "var(--secondary)" }}>
          Register now
        </Link>
      </p>
    </AuthLayout>
  );
}
