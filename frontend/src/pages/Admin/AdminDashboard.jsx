import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLeads } from "../../api/leadApi";
import { getVehicles } from "../../api/vehicleApi";
import { getStaff } from "../../api/adminUserApi";
import { getSales } from "../../api/saleApi";
import { getAppointments } from "../../api/appointmentApi";
import ActivityPanel from "../../components/ActivityPanel";
import { getAuth } from "../../utils/auth";
import "../../styles/dashboard.css";
import "../../styles/main.css";

function formatCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { role } = getAuth();
  const isAdmin = role === "admin";
  const [dashboard, setDashboard] = useState({
    leads: [],
    vehicles: [],
    staff: [],
    sales: [],
    appointments: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadsRes, vehiclesRes, staffRes, salesRes, appointmentsRes] = await Promise.all([
        getLeads().catch(() => ({ data: [] })),
        getVehicles().catch(() => ({ data: [] })),
        getStaff().catch(() => ({ data: [] })),
        getSales().catch(() => ({ data: [] })),
        getAppointments().catch(() => ({ data: [] })),
      ]);

      setDashboard({
        leads: leadsRes.data || [],
        vehicles: vehiclesRes.data || [],
        staff: staffRes.data || [],
        sales: salesRes.data || [],
        appointments: appointmentsRes.data || [],
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = useMemo(() => {
    const totalLeads = dashboard.leads.length;
    const activeUsers = dashboard.staff.filter((user) => !user.isDeleted).length;
    const availableVehicles = dashboard.vehicles.filter((vehicle) => vehicle.status === "available").length;
    const soldVehicles = dashboard.vehicles.filter((vehicle) => vehicle.status === "sold").length;
    const reservedVehicles = dashboard.vehicles.filter((vehicle) => vehicle.status === "reserved").length;
    const pendingAppointments = dashboard.appointments.filter((appointment) =>
      ["pending", "scheduled"].includes((appointment.status || "").toLowerCase())
    ).length;
    const convertedLeads = dashboard.leads.filter((lead) => lead.status === "converted").length;
    const hotLeads = dashboard.leads.filter((lead) => lead.interest_level === "high").length;
    const monthlyRevenue = dashboard.sales.reduce((sum, sale) => sum + Number(sale.paid_amount || sale.price || 0), 0);
    const outstandingPayments = dashboard.sales.reduce((sum, sale) => sum + Number(sale.pending_amount || 0), 0);

    const salesData = dashboard.sales
      .slice()
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(-6)
      .map((sale) => ({
        month: new Date(sale.createdAt).toLocaleDateString("en-US", { month: "short" }),
        revenue: Number(sale.paid_amount || sale.price || 0),
      }));

    return {
      totalLeads,
      activeUsers,
      availableVehicles,
      soldVehicles,
      reservedVehicles,
      pendingAppointments,
      convertedLeads,
      hotLeads,
      monthlyRevenue,
      outstandingPayments,
      salesData,
    };
  }, [dashboard]);

  const quickActions = useMemo(
    () => [
      {
        title: "Add Vehicle",
        description: "Create a new inventory entry and keep the showroom stock moving.",
        meta: `${stats.availableVehicles} currently available`,
        tone: "primary",
        onClick: () => navigate("/vehicles/add"),
      },
      {
        title: "Review Hot Leads",
        description: "Open CRM and follow up with your most interested prospects first.",
        meta: `${stats.hotLeads} high-interest lead${stats.hotLeads === 1 ? "" : "s"}`,
        tone: "soft",
        onClick: () => navigate("/leads"),
      },
      {
        title: "Pending Appointments",
        description: "Check scheduled visits that still need attention or confirmation.",
        meta: `${stats.pendingAppointments} pending booking${stats.pendingAppointments === 1 ? "" : "s"}`,
        tone: "soft",
        onClick: () => navigate("/appointments"),
      },
      {
        title: "Record Sale",
        description: "Capture a transaction and update paid versus pending balances.",
        meta: `${formatCurrency(stats.outstandingPayments)} still outstanding`,
        tone: "primary",
        onClick: () => navigate("/sales/add"),
      },
      {
        title: "Create Staff User",
        description: "Add a new operational account for the team.",
        meta: `${stats.activeUsers} active internal user${stats.activeUsers === 1 ? "" : "s"}`,
        tone: "soft",
        onClick: () => navigate("/admin/create-staff"),
      },
      {
        title: "Open Activity Panel",
        description: "Review recent actions across sales, appointments, and inventory.",
        meta: "Live admin timeline",
        tone: "soft",
        onClick: () => navigate("/admin/activities"),
      },
    ],
    [navigate, stats.activeUsers, stats.availableVehicles, stats.hotLeads, stats.outstandingPayments, stats.pendingAppointments]
  );
  const visibleQuickActions = useMemo(
    () => quickActions.filter((action) => isAdmin || action.title !== "Create Staff User"),
    [isAdmin, quickActions]
  );

  if (loading) {
    return (
      <div className="page">
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div style={{ color: "var(--danger)", display: "grid", gap: "14px" }}>
          <div>{error}</div>
          <div>
            <button className="btn btnPrimary" onClick={fetchDashboardData}>Retry</button>
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...stats.salesData.map((item) => item.revenue), 1);
  const inventoryTotal = stats.availableVehicles + stats.soldVehicles + stats.reservedVehicles;

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero card">
        <div className="dashboard-hero-inner">
          <div className="dashboard-hero-copy">
            <div className="dashboard-eyebrow">Car Dealership System</div>
            <h1>Admin Dashboard.</h1>
            <p>
              Monitor leads, inventory, appointments, revenue, and team activity.
            </p>
          </div>
          <div className="dashboard-hero-stats">
            <HeroTile label="Revenue Collected" value={formatCurrency(stats.monthlyRevenue)} />
            <HeroTile label="Outstanding" value={formatCurrency(stats.outstandingPayments)} />
            <HeroTile label="Converted Leads" value={String(stats.convertedLeads)} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <DashboardCard title="Total Leads" value={stats.totalLeads} meta={`${stats.hotLeads} hot leads`} icon="CRM" tone="green" />
        <DashboardCard title="Active Users" value={stats.activeUsers} meta="Internal team accounts" icon="TEAM" tone="blue" />
        <DashboardCard title="Available Vehicles" value={stats.availableVehicles} meta={`${stats.reservedVehicles} reserved`} icon="STOCK" tone="green" />
        <DashboardCard title="Pending Appointments" value={stats.pendingAppointments} meta="Need follow-up or fulfillment" icon="TIME" tone="blue" />
      </div>

      <div className="dashboard-grid dashboard-grid-secondary">
        <DashboardCard title="Collected Revenue" value={formatCurrency(stats.monthlyRevenue)} meta="Paid amount across recorded sales" icon="PAY" tone="green" large />
        <DashboardCard title="Outstanding Payments" value={formatCurrency(stats.outstandingPayments)} meta="Pending balances across sales" icon="DUE" tone="blue" large />
      </div>

      <div className="dashboard-2col">
        <div className="chart-container">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Sales Performance</h3>
              <p className="chart-subtitle">Recent collected revenue from the latest six sales entries</p>
            </div>
            <button className="btn" onClick={() => navigate("/sales")}>Open Sales</button>
          </div>

          <div className="dashboard-bar-chart">
            {stats.salesData.length > 0 ? (
              stats.salesData.map((item, index) => (
                <div key={`${item.month}-${index}`} className="dashboard-bar-item">
                  <div className="dashboard-bar-value">{formatCurrency(item.revenue)}</div>
                  <div className="dashboard-bar-track">
                    <div className="dashboard-bar-fill" style={{ height: `${Math.max((item.revenue / maxRevenue) * 100, 10)}%` }} />
                  </div>
                  <div className="dashboard-bar-label">{item.month}</div>
                </div>
              ))
            ) : (
              <div className="dashboard-empty">No sales data available yet.</div>
            )}
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-head">
            <div>
              <h3 className="chart-title">Inventory Balance</h3>
              <p className="chart-subtitle">Available, reserved, and sold stock across the current inventory</p>
            </div>
            <button className="btn" onClick={() => navigate("/vehicles")}>Open Inventory</button>
          </div>

          <div className="inventory-balance">
            <InventoryRow label="Available" value={stats.availableVehicles} percentage={inventoryTotal ? (stats.availableVehicles / inventoryTotal) * 100 : 0} tone="green" />
            <InventoryRow label="Reserved" value={stats.reservedVehicles} percentage={inventoryTotal ? (stats.reservedVehicles / inventoryTotal) * 100 : 0} tone="blue" />
            <InventoryRow label="Sold" value={stats.soldVehicles} percentage={inventoryTotal ? (stats.soldVehicles / inventoryTotal) * 100 : 0} tone="navy" />
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
          <div>
            <div className="sectionTitle">Quick Actions</div>
            <div className="sub">Jump into the next likely operational task with shortcuts that reflect the current dashboard state.</div>
          </div>
          <button className="btn" onClick={fetchDashboardData}>Refresh Data</button>
        </div>

        <div className="dashboard-actions-grid">
          {visibleQuickActions.map((action) => (
            <button
              key={action.title}
              type="button"
              className={`dashboard-action-card ${action.tone}`}
              onClick={action.onClick}
            >
              <div className="dashboard-action-top">
                <div className="dashboard-action-title">{action.title}</div>
                <div className="dashboard-action-meta">{action.meta}</div>
              </div>
              <div className="dashboard-action-description">{action.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <ActivityPanel limit={5} showViewAll />
      </div>
    </div>
  );
}

function HeroTile({ label, value }) {
  return (
    <div className="dashboard-hero-tile">
      <div className="dashboard-hero-label">{label}</div>
      <div className="dashboard-hero-value">{value}</div>
    </div>
  );
}

function DashboardCard({ title, value, meta, icon, tone = "green", large = false }) {
  return (
    <div className={`dashboard-card dashboard-tone-${tone} ${large ? "dashboard-card-large" : ""}`}>
      <div className="card-header">
        <h3>{title}</h3>
        <div className="card-icon">{icon}</div>
      </div>
      <div className="card-value">{value}</div>
      <div className="card-footer neutral">{meta}</div>
    </div>
  );
}

function InventoryRow({ label, value, percentage, tone }) {
  return (
    <div className="inventory-row">
      <div className="inventory-row-head">
        <div className="inventory-row-label">{label}</div>
        <div className="inventory-row-value">{value}</div>
      </div>
      <div className="inventory-row-track">
        <div className={`inventory-row-fill ${tone}`} style={{ width: `${Math.max(percentage, value > 0 ? 8 : 0)}%` }} />
      </div>
    </div>
  );
}
