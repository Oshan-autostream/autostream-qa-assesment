import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { getDocs, deleteDoc } from "../../api/documentApi";
import { getAuth } from "../../utils/auth";

const STATUS_STYLES = {
  available: { bg: "rgba(141, 187, 1, 0.12)", color: "#8DBB01", label: "Available" },
  in_use: { bg: "rgba(12, 58, 87, 0.08)", color: "#0C3A57", label: "In Use" },
  missing: { bg: "rgba(186, 94, 94, 0.12)", color: "var(--danger)", label: "Missing" },
  archived: { bg: "rgba(12, 58, 87, 0.08)", color: "#0C3A57", label: "Archived" },
};

export default function DocumentList() {
  const { role } = getAuth();
  const canDeleteDocuments = role === "admin";
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getDocs();
      setDocs(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load documents", "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = docs.length;
    const available = docs.filter((d) => String(d.status || "").toLowerCase() === "available").length;
    const inUse = docs.filter((d) => String(d.status || "").toLowerCase() === "in_use").length;
    const missing = docs.filter((d) => String(d.status || "").toLowerCase() === "missing").length;
    const archived = docs.filter((d) => String(d.status || "").toLowerCase() === "archived").length;
    return { total, available, inUse, missing, archived };
  }, [docs]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return docs;
    return docs.filter((d) => String(d.status || "").toLowerCase() === statusFilter);
  }, [docs, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document permanently?")) return;
    try {
      await deleteDoc(id);
      setDocs((current) => current.filter((doc) => doc._id !== id));
      toast.success("Document deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", "Delete failed");
    }
  };

  const getVehicleName = (vehicle) => {
    if (!vehicle) return "Unassigned";
    return `${vehicle.brand || ""} ${vehicle.type || ""}`.trim() || "Unassigned";
  };

  const getVehicleNumber = (vehicle) =>
    vehicle?.vehicleNumber || vehicle?.vehicle_number || vehicle?.registrationNo || vehicle?.regNo || "No registration";

  const getStatusStyle = (status) => STATUS_STYLES[String(status || "").toLowerCase()] || STATUS_STYLES.available;

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Documents</div>
        </div>
        <button className="btn btnPrimary" onClick={() => navigate("/documents/add")}>
          Add Document
        </button>
      </div>

      <div className="kpiGrid">
        <MetricCard label="Total Documents" value={loading ? "—" : stats.total} sub="All physical records" />
        <MetricCard label="Available" value={loading ? "—" : stats.available} sub="Ready for use" />
        <MetricCard label="In Use" value={loading ? "—" : stats.inUse} sub="Currently checked out" />
        <MetricCard label="Missing" value={loading ? "—" : stats.missing} sub="Needs attention" />
        <MetricCard label="Archived" value={loading ? "—" : stats.archived} sub="Stored records" />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Document Library</div>
            <div className="sub">Filter records by status and keep inventory paperwork tidy.</div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
            <select className="select" style={{ minWidth: "180px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="in_use">In Use</option>
              <option value="missing">Missing</option>
              <option value="archived">Archived</option>
            </select>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {statusFilter === "all" ? "No documents yet." : "No documents found for this status."}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            justifyContent: "start",
            gap: "18px",
          }}
        >
          {filtered.map((doc) => {
            const statusStyle = getStatusStyle(doc.status);
            return (
              <div key={doc._id} className="entityCard" style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "340px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ fontSize: "21px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>
                      {doc.title || doc.docType || "Untitled document"}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "rgba(12, 58, 87, 0.08)",
                          color: "var(--navy)",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {doc.docType || "Document"}
                      </span>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {statusStyle.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="entityMetaCard" style={{ display: "grid", gap: "10px" }}>
                  <InfoRow label="Vehicle" value={getVehicleName(doc.vehicle)} />
                  <InfoRow label="Registration" value={getVehicleNumber(doc.vehicle)} />
                  <InfoRow label="Location" value={doc.location || "Not specified"} />
                  <InfoRow label="Reference" value={doc.referenceNo || "None"} />
                </div>

                {doc.notes ? (
                  <div style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                    {doc.notes}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={() => navigate(`/documents/edit/${doc._id}`)} style={{ flex: 1 }}>
                    Edit
                  </button>
                  {canDeleteDocuments ? (
                    <button
                      className="btn"
                      onClick={() => handleDelete(doc._id)}
                      style={{ flex: 1, color: "var(--danger)", borderColor: "rgba(186, 94, 94, 0.25)" }}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="kpiCard">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue">{value}</div>
      <div className="kpiSub">{sub}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
      <span style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </span>
      <span style={{ color: "var(--navy)", fontSize: "14px", fontWeight: 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}
