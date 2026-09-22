import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AuthShell from "../../components/AuthShell";
import { normalizeEmail, validateEmailAddress } from "../../utils/validation";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmailAddress(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setLoading(true);
    setError("");

    try {
      const normalizedEmail = normalizeEmail(email);
      await api.post("/auth/forgot-password", { email: normalizedEmail });
      navigate("/reset-password", {
        state: {
          email: normalizedEmail,
          notice: `A temporary OTP has been sent to ${normalizedEmail}. The code expires in 10 minutes.`,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Password Recovery"
      title="Reset your password"
      subtitle="Enter the email connected to your account and we’ll send you a temporary OTP code."
      compact
      footer={
        <Link to="/login" style={{ color: "var(--primary)", fontWeight: 700 }}>
          Back to login
        </Link>
      }
    >
      {error ? (
        <div
          style={{
            marginBottom: "18px",
            padding: "14px 16px",
            borderRadius: "16px",
            border: "1px solid rgba(186, 94, 94, 0.18)",
            background: "rgba(255,255,255,0.92)",
            color: "var(--danger)",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: "18px" }}>
        <div>
          <label className="label">Email Address</label>
          <input
            className="input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            required
          />
        </div>

        <button type="submit" className="btn btnPrimary" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </AuthShell>
  );
}

export default ForgotPassword;
