const LEAD_SOURCE_OPTIONS = ["website", "phone", "walk-in", "referral", "other"];
const INTEREST_OPTIONS = ["high", "medium", "low"];
const STATUS_OPTIONS = ["new", "contacted", "qualified", "converted", "lost"];

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

export default function LeadForm({
  title,
  subtitle,
  form,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  onCancel,
  includeStatus = false,
}) {
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
          <SectionCard title="Lead Identity" subtitle="Capture the customer details cleanly so the CRM stays reliable and easy for the team to scan.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Full Name</label>
                <input className="input" name="name" value={form.name} onChange={onChange} placeholder="Customer full name" required />
              </div>
              <div>
                <label className="label">Contact Number</label>
                <input className="input" name="contact_number" value={form.contact_number} onChange={onChange} placeholder="0771234567" inputMode="numeric" maxLength={10} required />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Email Address</label>
                <input className="input" type="email" name="email" value={form.email} onChange={onChange} placeholder="customer@email.com" required />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Lead Quality" subtitle="Set the source, interest level, and current stage so follow-up work stays aligned across staff.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Lead Source</label>
                <select className="select" name="lead_source" value={form.lead_source} onChange={onChange} required>
                  <option value="">Select source</option>
                  {LEAD_SOURCE_OPTIONS.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Interest Level</label>
                <select className="select" name="interest_level" value={form.interest_level} onChange={onChange}>
                  <option value="">Select interest</option>
                  {INTEREST_OPTIONS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {includeStatus && (
                <div>
                  <label className="label">Status</label>
                  <select className="select" name="status" value={form.status} onChange={onChange}>
                    <option value="">Select status</option>
                    {STATUS_OPTIONS.map((statusOption) => (
                      <option key={statusOption} value={statusOption}>
                        {statusOption}
                      </option>
                    ))}
                  </select>
                </div>
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
