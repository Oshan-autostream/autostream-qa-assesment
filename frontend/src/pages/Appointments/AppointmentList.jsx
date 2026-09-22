import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { getAuth } from "../../utils/auth";
import { completeAppointment } from "../../api/appointmentApi";

const STATUS_STYLES = {
  scheduled: { bg: "rgba(12, 58, 87, 0.08)", color: "#0C3A57", label: "Scheduled" },
  completed: { bg: "rgba(141, 187, 1, 0.12)", color: "#8DBB01", label: "Completed" },
  cancelled: { bg: "rgba(186, 94, 94, 0.12)", color: "#ba5e5e", label: "Cancelled" },
};

const formatSlot = (time) => {
  if (!time) return "—";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();
  const auth = getAuth();
  const isAdmin = auth?.role === "admin";

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/appointments");
      setAppointments(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load appointments", "Load failed");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const stats = useMemo(() => {
    const total = appointments.length;
    const scheduled = appointments.filter((a) => a.status === "scheduled").length;
    const completed = appointments.filter((a) => a.status === "completed").length;
    const cancelled = appointments.filter((a) => a.status === "cancelled").length;
    return { total, scheduled, completed, cancelled };
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (statusFilter === "all") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  const deleteAppointment = async (id) => {
    if (!window.confirm("Delete this appointment permanently?")) return;

    try {
      setDeletingId(id);
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a._id !== id));
      toast.success("Appointment deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete appointment", "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  const markAppointmentComplete = async (id) => {
    try {
      setCompletingId(id);
      const res = await completeAppointment(id);
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === id ? { ...appointment, ...res.data.appointment } : appointment
        )
      );
      toast.success("Appointment marked as completed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete appointment", "Update failed");
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Appointments</div>
          <div className="pageSub">
            {isAdmin
              ? "Review and manage every booked session across the dealership."
              : "Review the appointments assigned to you or created by you."}
          </div>
        </div>
        <button className="btn btnPrimary" onClick={() => navigate("/appointments/add")}>
          Add Appointment
        </button>
      </div>

      <div className="kpiGrid">
        <MetricCard label="Total" value={loading ? "—" : stats.total} sub="All bookings" />
        <MetricCard label="Scheduled" value={loading ? "—" : stats.scheduled} sub="Upcoming sessions" />
        <MetricCard label="Completed" value={loading ? "—" : stats.completed} sub="Finished visits" />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Schedule Overview</div>
            <div className="sub">
              {isAdmin ? "All appointment activity is visible here." : "Only the sessions relevant to your role are shown."}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginLeft: "auto", flexWrap: "wrap" }}>
            <select className="select" style={{ minWidth: "180px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} disabled={loading}>
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
            <button className="btn" onClick={fetchAppointments} disabled={loading}>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {!loading && filteredAppointments.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {statusFilter === "all" ? "No appointments scheduled yet." : "No appointments match this status."}
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
          {filteredAppointments.map((appointment) => {
            const statusStyle = STATUS_STYLES[appointment.status] || STATUS_STYLES.scheduled;
            const customerName = appointment.customer?.name || appointment.lead?.name || "Customer appointment";
            return (
              <div key={appointment._id} className="entityCard" style={{ display: "grid", gap: "16px", width: "100%", maxWidth: "340px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.2 }}>
                      {customerName}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: "rgba(236, 236, 236, 0.82)",
                          color: "var(--navy)",
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {appointment.appointmentType || "viewing"}
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
                  <InfoRow label="Vehicle" value={appointment.vehicle?.brand ? `${appointment.vehicle.brand} ${appointment.vehicle.model || appointment.vehicle.type || ""}` : "—"} />
                  <InfoRow label="Date" value={formatDate(appointment.date)} />
                  <InfoRow label="Session" value={formatSlot(appointment.time)} />
                  <InfoRow
                    label="Assigned Staff"
                    value={appointment.staffMember?.name || (appointment.createdBy?.name ? `${appointment.createdBy.name} (creator)` : "—")}
                  />
                </div>

                {appointment.notes ? (
                  <div style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.65 }}>
                    {appointment.notes}
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    className="btn"
                    onClick={() => markAppointmentComplete(appointment._id)}
                    style={{ flex: 1 }}
                    disabled={appointment.status !== "scheduled" || completingId === appointment._id || deletingId === appointment._id}
                  >
                    {completingId === appointment._id ? "Completing..." : "Complete"}
                  </button>
                  <button className="btn btnPrimary" onClick={() => navigate(`/appointments/edit/${appointment._id}`)} style={{ flex: 1 }} disabled={deletingId === appointment._id}>
                    Edit
                  </button>
                  <button
                    className="btn"
                    onClick={() => deleteAppointment(appointment._id)}
                    style={{ flex: 1, color: "var(--danger)", borderColor: "rgba(186, 94, 94, 0.25)" }}
                    disabled={deletingId === appointment._id || completingId === appointment._id}
                  >
                    {deletingId === appointment._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

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

export default AppointmentList;
