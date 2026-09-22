import PasswordField from "../../components/PasswordField";

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div>
        <div className="sectionTitle">{title}</div>
        <div className="sub">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

export default function UserForm({
  title,
  subtitle,
  form,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  onCancel,
  showPassword = false,
  showActiveToggle = false,
  identity = {},
}) {
  const passwordMatchState = showPassword
    ? form.passwordConfirm
      ? form.password === form.passwordConfirm
        ? { text: "Passwords match.", color: "var(--success)" }
        : { text: "Passwords do not match.", color: "var(--danger)" }
      : null
    : null;

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">{title}</div>
          <div className="pageSub">{subtitle}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "20px", maxWidth: "920px", margin: "0 auto" }}>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "20px" }}>
          <SectionCard title="Identity" subtitle="Keep user information simple and organized for easy management.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input" name="name" value={form.name || ""} onChange={onChange} placeholder="Full name" required />
                <div className="sub" style={{ marginTop: "8px" }}>
                  Letters and spaces only.
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" name="email" value={form.email || ""} onChange={onChange} placeholder="name@company.com" required />
              </div>
              {showPassword && (
                <>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <PasswordField
                      label="Password"
                      name="password"
                      value={form.password || ""}
                      onChange={onChange}
                      placeholder="Create a secure password"
                      required
                      autoComplete="new-password"
                      helpText="Use at least 8 characters with uppercase, lowercase, a number, and a special character."
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <PasswordField
                      label="Confirm Password"
                      name="passwordConfirm"
                      value={form.passwordConfirm || ""}
                      onChange={onChange}
                      placeholder="Re-enter the password"
                      required
                      autoComplete="new-password"
                      validationText={passwordMatchState?.text}
                      validationColor={passwordMatchState?.color}
                    />
                  </div>
                </>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Role & Access" subtitle="Set the right account type.">
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ maxWidth: "320px" }}>
                <label className="label">Role</label>
                <select className="select" name="role" value={form.role} onChange={onChange}>
                  <option value="staff">Staff</option>
                  <option value="user">User</option>
                </select>
              </div>

              {showActiveToggle && (
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    background: "rgba(255,255,255,0.72)",
                    color: "var(--text)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  <input type="checkbox" name="isDeleted" checked={!!form.isDeleted} onChange={onChange} style={{ width: "16px", height: "16px" }} />
                  Deactivate account
                </label>
              )}
            </div>
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={onCancel} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
