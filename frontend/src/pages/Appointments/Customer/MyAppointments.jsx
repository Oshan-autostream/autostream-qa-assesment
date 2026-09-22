import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { formatDisplayTime } from "./CustomerAppointmentForm";

const STATUS_META = {
  scheduled: { label: "Scheduled", badge: "badge badgeCyan" },
  completed: { label: "Completed", badge: "badge badgeGreen" },
  cancelled: { label: "Cancelled", badge: "badge badgePink" },
};

function AppointmentMeta({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--text-muted)",
          minWidth: "88px",
        }}
      >
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 700 }}>{value}</div>
    </div>
  );
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/customer/appointments/my")
      .then((res) => setAppointments(res.data))
      .catch((err) => alert(err.response?.data?.message || "Failed to load"));
  }, []);

  const deleteAppointment = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) return;

    setDeleting(id);
    try {
      await api.delete(`/customer/appointments/${id}`);
      setAppointments((current) => current.filter((appointment) => appointment._id !== id));
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to cancel appointment";
      alert(errorMsg);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
      </div>

      <div
        className="card"
        style={{
          overflow: "hidden",
          background:
            "radial-gradient(circle at top right, rgba(141,187,1,0.16), transparent 30%), linear-gradient(135deg, rgba(12,58,87,0.98) 0%, rgba(17,73,109,0.95) 58%, rgba(141,187,1,0.9) 100%)",
          color: "#fff",
          marginBottom: "22px",
        }}
      >
        <div
          className="cardPad"
          style={{
            padding: "28px 30px",
            display: "grid",
            gap: "12px",
          }}
        >
          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.74 }}>
              Customer Overview
            </div>
            <div style={{ fontSize: "clamp(28px, 4vw, 40px)", lineHeight: 1.08, fontWeight: 800, letterSpacing: "-0.05em", maxWidth: "600px" }}>
              Your bookings.
            </div>
            <div style={{ color: "rgba(255,255,255,0.82)", lineHeight: 1.7, maxWidth: "580px" }}>
              Review scheduled visits, check assigned support, and update your booking without unnecessary clutter.
            </div>
          </div>
        </div>
      </div>

      {appointments.length === 0 ? (
        <div style={{ maxWidth: "760px", margin: "32px auto", textAlign: "center", color: "var(--text-muted)" }}>
          <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", marginBottom: "10px" }}>No appointments yet</div>
          <div style={{ marginBottom: "18px", lineHeight: 1.7 }}>
            Book your first showroom visit or test drive to get started.
          </div>
          <button onClick={() => navigate("/book-appointment")} className="btn btnPrimary">
            Book Your First Appointment
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 380px))",
              justifyContent: "start",
              gap: "18px",
            }}
          >
            {appointments.map((appointment) => {
              const status = STATUS_META[appointment.status] || STATUS_META.scheduled;
              return (
                <article
                  key={appointment._id}
                  className="card"
                  style={{
                    overflow: "hidden",
                    background: "rgba(255,255,255,0.9)",
                    width: "100%",
                    maxWidth: "380px",
                  }}
                >
                  <div
                    style={{
                      height: "6px",
                      background:
                        appointment.status === "completed"
                          ? "linear-gradient(90deg, #8DBB01, #b2d94f)"
                          : appointment.status === "cancelled"
                            ? "linear-gradient(90deg, #ba5e5e, #d98b8b)"
                            : "linear-gradient(90deg, #0C3A57, #8DBB01)",
                    }}
                  />

                  <div className="cardPad" style={{ display: "grid", gap: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start" }}>
                      <div style={{ display: "grid", gap: "4px" }}>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
                          {appointment.vehicle?.brand} {appointment.vehicle?.model || appointment.vehicle?.type || ""}
                        </div>
                        <div className="sub">{appointment.vehicle?.type || "Vehicle"} • {appointment.vehicle?.year || "Year not set"}</div>
                      </div>
                      <span className={status.badge}>{status.label}</span>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gap: "12px",
                        padding: "16px",
                        borderRadius: "18px",
                        background: "rgba(255,255,255,0.78)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <AppointmentMeta
                        label="Date"
                        value={new Date(appointment.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      />
                      <AppointmentMeta label="Session" value={formatDisplayTime(appointment.time)} />
                      <AppointmentMeta label="Staff" value={appointment.staffMember?.name || "To be assigned"} />
                      <AppointmentMeta label="Email" value={appointment.staffMember?.email || "Shared after assignment"} />
                    </div>

                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <button
                        onClick={() => navigate(`/edit-my-appointment/${appointment._id}`)}
                        className="btn"
                        disabled={appointment.status !== "scheduled"}
                        style={{ flex: 1, opacity: appointment.status !== "scheduled" ? 0.5 : 1 }}
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => deleteAppointment(appointment._id)}
                        className="btn"
                        disabled={appointment.status !== "scheduled" || deleting === appointment._id}
                        style={{
                          flex: 1,
                          opacity: appointment.status !== "scheduled" ? 0.5 : 1,
                          color: "var(--danger)",
                          borderColor: "rgba(186, 94, 94, 0.25)",
                        }}
                      >
                        {deleting === appointment._id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
