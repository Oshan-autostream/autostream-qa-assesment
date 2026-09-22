import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import { setAuth, getDefaultRoute } from "../../utils/auth";
import AuthShell from "../../components/AuthShell";
import PasswordField from "../../components/PasswordField";
import { normalizeEmail, validateEmailAddress } from "../../utils/validation";

function Login() {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials((current) => ({ ...current, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    const emailError = validateEmailAddress(credentials.email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", {
        ...credentials,
        email: normalizeEmail(credentials.email),
      });
      setAuth({
        token: res.data.token,
        role: res.data.user.role,
        user: res.data.user,
      });
      navigate(getDefaultRoute(res.data.user.role), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Car Dealership System"
      title="Welcome back"
      subtitle="Sign in to continue with bookings, inventory, and customer operations."
      compact
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Create one
          </Link>
        </>
      }
    >
      {error ? (
        <div className="authAlert authAlertError">{error}</div>
      ) : null}

      <form onSubmit={submit} className="authForm">
        <div>
          <label className="label">Email Address</label>
          <input className="input" name="email" type="email" placeholder="you@example.com" value={credentials.email} onChange={handleChange} required />
        </div>

        <PasswordField
          label="Password"
          name="password"
          value={credentials.password}
          onChange={handleChange}
          placeholder="Password"
          required
          autoComplete="current-password"
        />

        <div className="authHelperRow">
          <span className="authHint">Use your registered email and password to continue.</span>
          <Link to="/forgot-password" className="authTextLink">
            Forgot password?
          </Link>
        </div>

        <button type="submit" className="btn btnPrimary authSubmitButton" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}

export default Login;
