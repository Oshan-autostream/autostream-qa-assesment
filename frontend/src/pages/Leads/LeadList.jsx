import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";

function getStatusMeta(status) {
  if (status === "qualified" || status === "converted") return { label: status, badge: "badge badgeGreen" };
  if (status === "contacted") return { label: "contacted", badge: "badge badgeOrange" };
  if (status === "lost") return { label: "lost", badge: "badge badgePink" };
  return { label: status || "new", badge: "badge badgeCyan" };
}

function getInterestMeta(level) {
  if (level === "high") return { label: "High", badge: "badge badgeGreen" };
  if (level === "medium") return { label: "Medium", badge: "badge badgeOrange" };
  if (level === "low") return { label: "Low", badge: "badge badgeCyan" };
  return { label: "Unset", badge: "badge" };
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

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", minWidth: "88px" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

export default function LeadList() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const navigate = useNavigate();
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/leads");
      setLeads(response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load leads", "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((lead) => lead.interest_level === "high").length;
    const contacted = leads.filter((lead) => lead.status === "contacted").length;
    const converted = leads.filter((lead) => lead.status === "converted").length;
    return { total, hot, contacted, converted };
  }, [leads]);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter((lead) => lead.status === statusFilter);
  }, [leads, statusFilter]);

  const onDelete = async (id, name) => {
    if (!window.confirm(`Delete lead "${name}"?`)) return;

    try {
      await api.delete(`/leads/${id}`);
      setLeads((current) => current.filter((lead) => lead._id !== id));
      toast.success("Lead deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">CRM & Leads</div>
        </div>
      </div>

      <div className="kpiGrid">
        <MetricCard label="Total Leads" value={loading ? "—" : stats.total} sub="Active CRM records" />
        <MetricCard label="Hot Leads" value={loading ? "—" : stats.hot} sub="High interest prospects" />
        <MetricCard label="Contacted" value={loading ? "—" : stats.contacted} sub="Follow-up in progress" />
        <MetricCard label="Converted" value={loading ? "—" : stats.converted} sub="Won opportunities" />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Lead Pipeline</div>
            <div className="sub">Filter by status, review lead quality, and move straight into updates.</div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
            <select className="select" style={{ minWidth: "180px" }} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            <button className="btn btnPrimary" onClick={() => navigate("/leads/add")}>
              Add Lead
            </button>
            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {!loading && filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {statusFilter === "all" ? "No leads yet. Start by creating your first CRM entry." : `No ${statusFilter} leads found.`}
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
          {filtered.map((lead) => {
            const status = getStatusMeta(lead.status);
            const interest = getInterestMeta(lead.interest_level);

            return (
              <div key={lead._id} className="entityCard" style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "340px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em" }}>{lead.name}</div>
                    <div className="sub">{lead.email || "No email added"}</div>
                  </div>
                  <span className={status.badge}>{status.label}</span>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <span className={interest.badge}>{interest.label} Interest</span>
                  <span className="badge badgeCyan">{lead.lead_source || "No source"}</span>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  <DetailRow label="Phone" value={lead.contact_number || "Not recorded"} />
                  <DetailRow label="Source" value={lead.lead_source || "Not recorded"} />
                  <DetailRow label="Interest" value={interest.label} />
                  <DetailRow label="Stage" value={status.label} />
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button className="btn btnPrimary" onClick={() => navigate(`/leads/edit/${lead._id}`)} style={{ flex: 1 }}>
                    Edit Lead
                  </button>
                  <button className="btn btnDanger" onClick={() => onDelete(lead._id, lead.name)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
