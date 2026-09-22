import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteSale, getSales, getSalesStats } from "../../api/saleApi";
import { getAuth } from "../../utils/auth";

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function getStatusMeta(status) {
  if (status === "completed") return { label: "Completed", badge: "badge badgeGreen" };
  if (status === "partial") return { label: "Partial", badge: "badge badgeOrange" };
  return { label: "Pending", badge: "badge badgePink" };
}

function getMethodLabel(method) {
  if (method === "bank_transfer") return "Bank Transfer";
  if (method === "cheque") return "Cheque";
  if (method === "cash") return "Cash";
  if (method === "other") return "Other";
  return "Not recorded";
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="kpiCard">
      <div className="kpiLabel">{label}</div>
      <div className="kpiValue" style={{ fontSize: "22px" }}>{value}</div>
      <div className="kpiSub">{sub}</div>
    </div>
  );
}

export default function SaleList() {
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const navigate = useNavigate();
  const { role } = getAuth();
  const canEdit = role === "admin" || role === "staff";
  const canDelete = role === "admin";
  const year = new Date().getFullYear();

  const load = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const salesResponse = await getSales();
      setSales(salesResponse.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load sales");
      setSales([]);
    } finally {
      setLoading(false);
    }

    try {
      const statsResponse = await getSalesStats(year);
      setStats(statsResponse.data || null);
    } catch {
      setStats(null);
    }
  }, [year]);

  useEffect(() => {
    load();
  }, [load]);

  const derivedStats = useMemo(() => {
    const completedSales = sales.filter((sale) => (sale.payment_status || "").toLowerCase() === "completed");
    const partialSales = sales.filter((sale) => (sale.payment_status || "").toLowerCase() === "partial");
    const totalRevenue = completedSales.reduce((sum, sale) => sum + Number(sale.price || 0), 0);
    const collectedAmount = sales.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0);
    const outstandingAmount = sales.reduce((sum, sale) => sum + Number(sale.pending_amount || 0), 0);
    const months = new Set();

    completedSales.forEach((sale) => {
      const date = new Date(sale.createdAt);
      months.add(`${date.getFullYear()}-${date.getMonth() + 1}`);
    });

    return {
      totalRevenue,
      totalSales: completedSales.length,
      partialSales: partialSales.length,
      collectedAmount,
      outstandingAmount,
      avgMonthlyRevenue: months.size ? totalRevenue / months.size : 0,
    };
  }, [sales]);

  const totalRevenue = stats?.totalRevenue ?? derivedStats.totalRevenue;
  const totalSales = stats?.totalSales ?? derivedStats.totalSales;
  const collectedAmount = stats?.collectedAmount ?? derivedStats.collectedAmount;
  const outstandingAmount = stats?.outstandingAmount ?? derivedStats.outstandingAmount;
  const avgMonthlyRevenue = stats?.avgMonthlyRevenue ?? derivedStats.avgMonthlyRevenue;

  const filteredSales = useMemo(() => {
    if (filter === "all") return sales;
    return sales.filter((sale) => (sale.payment_status || "").toLowerCase() === filter);
  }, [sales, filter]);

  const onDelete = async (id) => {
    if (!canDelete) return alert("Access denied");
    if (!window.confirm("Delete this sale record?")) return;

    try {
      await deleteSale(id);
      alert("Sale deleted");
      load();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Sales</div>
        </div>
      </div>

      {error && (
        <div
         
          style={{ marginBottom: "20px", borderColor: "rgba(186, 94, 94, 0.35)", color: "var(--danger)", background: "rgba(255,255,255,0.94)" }}
        >
          {error}
        </div>
      )}

      <div className="kpiGrid">
        <MetricCard label="Completed Sales" value={loading ? "—" : totalSales} sub="Fully settled transactions" />
        <MetricCard label="Collected" value={loading ? "—" : formatCurrency(collectedAmount)} sub="Payments received so far" />
        <MetricCard label="Outstanding" value={loading ? "—" : formatCurrency(outstandingAmount)} sub="Remaining balance to collect" />
        <MetricCard label="Avg Monthly" value={loading ? "—" : formatCurrency(Math.round(avgMonthlyRevenue))} sub={`Completed revenue in ${year}`} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Sales Ledger</div>
            <div className="sub">Filter by payment progress and keep the collection team aligned.</div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
            <select className="select" value={filter} onChange={(event) => setFilter(event.target.value)} style={{ minWidth: "180px" }}>
              <option value="all">All Sales</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>

            {canEdit && (
              <button className="btn btnPrimary" onClick={() => navigate("/sales/add")}>
                Add Sale
              </button>
            )}

            <button className="btn" onClick={load} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {!loading && filteredSales.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {filter === "all" ? "No sales records yet." : `No ${filter} sales found.`}
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
          {filteredSales.map((sale) => {
            const statusMeta = getStatusMeta((sale.payment_status || "").toLowerCase());

            return (
              <div key={sale._id} className="entityCard" style={{ display: "grid", gap: "18px", width: "100%", maxWidth: "340px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "4px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.03em" }}>
                      {sale.vehicle?.brand || "Vehicle"} {sale.vehicle?.model || sale.vehicle?.type || ""}
                    </div>
                    <div className="sub">{sale.customer?.name || "Customer not linked"}</div>
                  </div>
                  <span className={statusMeta.badge}>{statusMeta.label}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                  <div style={detailTileStyle}>
                    <div style={detailLabelStyle}>Price</div>
                    <div style={detailValueStyle}>{formatCurrency(sale.price)}</div>
                  </div>
                  <div style={detailTileStyle}>
                    <div style={detailLabelStyle}>Paid</div>
                    <div style={detailValueStyle}>{formatCurrency(sale.paid_amount)}</div>
                  </div>
                  <div style={detailTileStyle}>
                    <div style={detailLabelStyle}>Pending</div>
                    <div style={detailValueStyle}>{formatCurrency(sale.pending_amount)}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "10px" }}>
                  <DetailRow label="Payment Method" value={getMethodLabel(sale.payment_method)} />
                  <DetailRow label="Reference" value={sale.payment_reference || sale.cheque_number || "Not recorded"} />
                  <DetailRow label="Bank" value={sale.bank_name || "Not recorded"} />
                  <DetailRow label="Payment Date" value={sale.payment_date ? new Date(sale.payment_date).toLocaleDateString() : "Not recorded"} />
                  <DetailRow label="Created" value={sale.createdAt ? new Date(sale.createdAt).toLocaleString() : "Not recorded"} />
                  <DetailRow label="Notes" value={sale.payment_details || "No extra details"} />
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {canEdit && (
                    <button className="btn btnPrimary" onClick={() => navigate(`/sales/edit/${sale._id}`)} style={{ flex: 1 }}>
                      Update Payment
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn btnDanger" onClick={() => onDelete(sale._id)} style={{ flex: 1 }}>
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: "20px", display: "grid", gap: "8px", maxWidth: "420px" }}>
        <div className="sectionTitle">Revenue Snapshot</div>
        <div className="sub">Completed sales contribute {formatCurrency(totalRevenue)} in booked revenue for {year}.</div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", minWidth: "108px" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

const detailTileStyle = {
  border: "1px solid var(--card-border)",
  borderRadius: "16px",
  padding: "14px",
  background: "rgba(255,255,255,0.72)",
  display: "grid",
  gap: "4px",
};

const detailLabelStyle = {
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
  fontWeight: 700,
};

const detailValueStyle = {
  fontSize: "18px",
  fontWeight: 700,
  color: "var(--text)",
};
