import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../api/axios";
import AuthShell from "../../components/AuthShell";
import PasswordField from "../../components/PasswordField";
import { normalizeEmail, validateEmailAddress, validateStrongPassword } from "../../utils/validation";

function Register() {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const passwordMatchState = user.passwordConfirm
    ? user.password === user.passwordConfirm
      ? { text: "Passwords match.", color: "var(--success)" }
      : { text: "Passwords do not match.", color: "var(--danger)" }
    : null;

  const handleChange = (e) => {
    setUser((current) => ({ ...current, [e.target.name]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();

    const emailError = validateEmailAddress(user.email);
    if (emailError) return setError(emailError);
    const passwordError = validateStrongPassword(user.password);
    if (passwordError) return setError(passwordError);
    if (user.password !== user.passwordConfirm) return setError("Passwords do not match");

    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: user.name,
        email: normalizeEmail(user.email),
        password: user.password,
        confirmPassword: user.passwordConfirm,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Create Account"
      title="Join Car Dealership System"
      subtitle="Create a customer account to manage bookings and stay connected to your preferred vehicles."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
            Sign in
          </Link>
        </>
      }
    >
      {error ? (
        <div className="authAlert authAlertError">{error}</div>
      ) : null}

      <form onSubmit={submit} className="authForm">
        <div className="authGridTwo">
          <div>
            <label className="label">Full Name</label>
            <input className="input" name="name" placeholder="John Doe" value={user.name} onChange={handleChange} required />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input className="input" name="email" type="email" placeholder="you@example.com" value={user.email} onChange={handleChange} required />
          </div>
        </div>

        <div className="authGridTwo">
          <PasswordField
            label="Password"
            name="password"
            value={user.password}
            onChange={handleChange}
            placeholder="Password"
            required
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm Password"
            name="passwordConfirm"
            value={user.passwordConfirm}
            onChange={handleChange}
            placeholder="Confirm password"
            required
            autoComplete="new-password"
            validationText={passwordMatchState?.text}
            validationColor={passwordMatchState?.color}
          />
        </div>

        <div className="authHint">
          Use at least 8 characters with uppercase, lowercase, a number, and a special character.
        </div>

        <button type="submit" className="btn btnPrimary authSubmitButton" disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}

export default Register;
