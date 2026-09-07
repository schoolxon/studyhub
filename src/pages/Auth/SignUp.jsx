import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/auth/AuthLayout";
import { Button, Field, Input } from "../../components/ui/ui";

export default function SignUp() {
  const navigate = useNavigate();
  const [libraryName, setLibraryName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!libraryName) nextErrors.libraryName = "Library name is required";
    if (!email) nextErrors.email = "Email is required";
    if (!password) nextErrors.password = "Password is required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    navigate("/app");
  };

  return (
    <AuthLayout
      title="Create your library"
      subtitle="Start with a single branch. Add seats and students next."
    >
      <form onSubmit={handleSubmit}>
        <Field label="Library name" htmlFor="libraryName" error={errors.libraryName}>
          <Input
            id="libraryName"
            size="lg"
            placeholder="Aarav Study Hall"
            value={libraryName}
            error={Boolean(errors.libraryName)}
            onChange={(event) => setLibraryName(event.target.value)}
          />
        </Field>
        <Field label="Email Address" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            size="lg"
            placeholder="owner@example.com"
            value={email}
            error={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <Input
            id="password"
            type="password"
            size="lg"
            placeholder="••••••••"
            value={password}
            error={Boolean(errors.password)}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <div style={{ paddingTop: 8 }}>
          <Button type="submit" variant="primary" size="lg" style={{ width: "100%" }}>
            Create account
          </Button>
        </div>
      </form>
      <p className="mt-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
        Already registered?{" "}
        <Link to="/login" className="font-semibold hover:underline" style={{ color: "var(--secondary)" }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
