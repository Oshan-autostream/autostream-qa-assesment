import ActivityPanel from "../../components/ActivityPanel";

export default function Activities() {
  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 20px 40px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 800, color: "var(--text)" }}>
          Recent Activities
        </h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "14px" }}>
          Review all recent admin and staff actions across the system.
        </p>
      </div>

      <ActivityPanel limit={50} showViewAll={false} />
    </div>
  );
}
