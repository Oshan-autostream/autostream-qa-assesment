import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { validateInternalAppointment } from "../../utils/validation";

const initialAppointment = {
  lead: "",
  vehicle: "",
  appointmentType: "viewing",
  date: "",
  time: "",
  notes: "",
  status: "scheduled",
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayTime = (time) => {
  if (!time) return "Select a time";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

const AddAppointment = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [appointment, setAppointment] = useState(initialAppointment);
  const [leads, setLeads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [closureInfo, setClosureInfo] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leadsRes, vehiclesRes] = await Promise.all([
          api.get("/leads"),
          api.get("/vehicles"),
        ]);
        setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
        setVehicles(
          (Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []).filter(
            (vehicle) => vehicle.status === "available"
          )
        );
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load leads and vehicles");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const loadSlots = async () => {
      if (!appointment.date) {
        setAvailableSlots([]);
        setClosureInfo(null);
        return;
      }

      try {
        setSlotsLoading(true);
        setClosureInfo(null);
        const res = await api.get(`/appointments/available-slots/${appointment.date}`);
        setClosureInfo(res.data?.closure || null);
        setAvailableSlots(res.data?.slots || []);
      } catch (err) {
        setClosureInfo(null);
        setAvailableSlots([]);
        setError(err.response?.data?.message || "Failed to load available sessions");
      } finally {
        setSlotsLoading(false);
      }
    };

    loadSlots();
  }, [appointment.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment((current) => ({
      ...current,
      [name]: value,
      ...(name === "date" ? { time: "" } : {}),
    }));

    if (error) {
      setError("");
    }
  };

  const validateAppointment = () => {
    return validateInternalAppointment(appointment);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateAppointment();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.post("/appointments/add", {
        ...appointment,
        status: "scheduled",
      });
      toast.success("Appointment created");
      navigate("/appointments");
    } catch (err) {
      setError(err.response?.data?.message || "Error adding appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--page-gradient)",
        padding: "32px 20px 48px",
      }}
    >
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        <div
          style={{
            background: "var(--surface-strong)",
            backdropFilter: "blur(14px)",
            borderRadius: "28px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "30px 32px 24px",
              borderBottom: "1px solid rgba(15, 20, 25, 0.08)",
            }}
          >
            <div style={{ maxWidth: "620px" }}>
              <div style={{ fontSize: "12px", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "10px" }}>
                Premium Booking
              </div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--navy)", marginBottom: "8px", lineHeight: 1.1 }}>
                Add Appointment
              </div>
              <div className="sub">Create the appointment directly from the form below.</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: "32px" }}>
            {error ? (
              <div
                style={{
                  marginBottom: "24px",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid rgba(185, 28, 28, 0.18)",
                  background: "rgba(254, 242, 242, 0.95)",
                  color: "#b91c1c",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            ) : null}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "18px",
              }}
            >
              <SectionCard title="Client" subtitle="Choose the customer and vehicle">
                <Field label="Lead">
                  <select
                    className="select"
                    name="lead"
                    value={appointment.lead}
                    onChange={handleChange}
                    required
                    disabled={loading || saving}
                    style={fieldStyle}
                  >
                    <option value="">Select lead</option>
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Vehicle">
                  <select
                    className="select"
                    name="vehicle"
                    value={appointment.vehicle}
                    onChange={handleChange}
                    required
                    disabled={loading || saving}
                    style={fieldStyle}
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {`${vehicle.brand} ${vehicle.type || vehicle.model || ""}`.trim()}
                      </option>
                    ))}
                  </select>
                </Field>
              </SectionCard>

              <SectionCard title="Schedule" subtitle="Future dates with hourly sessions only">
                <Field label="Date">
                  <input
                    className="input"
                    type="date"
                    name="date"
                    value={appointment.date}
                    onChange={handleChange}
                    min={getTodayDateString()}
                    required
                    disabled={saving}
                    style={fieldStyle}
                  />
                </Field>

                <Field label="Available Sessions">
                  {slotsLoading ? (
                    <div style={slotInfoStyle}>Checking hourly availability...</div>
                  ) : closureInfo ? (
                    <div
                      style={{
                        ...slotInfoStyle,
                        color: "var(--danger)",
                        border: "1px solid rgba(186, 94, 94, 0.22)",
                        background: "rgba(255,255,255,0.96)",
                        fontWeight: 600,
                      }}
                    >
                      {closureInfo.message}
                    </div>
                  ) : appointment.date ? (
                    availableSlots.length > 0 ? (
                      <div style={slotGridStyle}>
                        {availableSlots.map((slot) => {
                          const disabled = slot.availableStaffCount === 0;
                          const selected = appointment.time === slot.time;

                          return (
                            <button
                              key={slot.time}
                              type="button"
                              onClick={() =>
                                !disabled &&
                                setAppointment((current) => ({ ...current, time: slot.time }))
                              }
                              disabled={disabled || saving}
                              style={{
                                ...slotButtonStyle,
                                ...(selected ? selectedSlotButtonStyle : {}),
                                ...(disabled ? disabledSlotButtonStyle : {}),
                              }}
                            >
                              <span>{formatDisplayTime(slot.time)}</span>
                              <small>{slot.availableStaffCount} staff free</small>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={slotInfoStyle}>No sessions are available on this date.</div>
                    )
                  ) : (
                    <div style={slotInfoStyle}>Choose a future date to load available hourly sessions.</div>
                  )}
                </Field>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "14px",
                    background: "rgba(141, 187, 1, 0.1)",
                    color: "var(--navy)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Each hour is one session. Capacity depends on how many staff members are available for that hour.
                </div>
              </SectionCard>

              <SectionCard title="Details" subtitle="Keep the booking information concise">
                <Field label="Appointment Type">
                  <select
                    className="select"
                    name="appointmentType"
                    value={appointment.appointmentType}
                    onChange={handleChange}
                    disabled={saving}
                    style={fieldStyle}
                  >
                    <option value="viewing">Viewing</option>
                    <option value="test_drive">Test Drive</option>
                    <option value="follow_up">Follow Up</option>
                  </select>
                </Field>

                <Field label="Current Status">
                  <input className="input" type="text" value="Scheduled" readOnly style={{ ...fieldStyle, background: "#f5f8f1", color: "var(--text-muted)", cursor: "not-allowed" }} />
                </Field>
              </SectionCard>

              <SectionCard title="Notes" subtitle="Optional internal notes">
                <Field label="Internal Notes">
                  <textarea
                    className="textarea"
                    name="notes"
                    value={appointment.notes}
                    onChange={handleChange}
                    placeholder="Add any important preparation details"
                    rows={5}
                    disabled={saving}
                    style={{ ...fieldStyle, resize: "vertical", minHeight: "140px" }}
                  />
                </Field>
              </SectionCard>
            </div>

            <div
              style={{
                marginTop: "28px",
                display: "flex",
                justifyContent: "space-between",
                gap: "16px",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                Selected session: <strong style={{ color: "var(--navy)" }}>{formatDisplayTime(appointment.time)}</strong>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button type="button" className="btn" onClick={() => navigate("/appointments")} disabled={saving}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || loading || !appointment.date || !appointment.time || Boolean(closureInfo)}
                  style={{
                    border: "none",
                    borderRadius: "999px",
                    padding: "14px 24px",
                    minWidth: "200px",
                    fontSize: "14px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    cursor: saving || !appointment.date || !appointment.time || closureInfo ? "not-allowed" : "pointer",
                    color: "#fffdf8",
                    background:
                      "linear-gradient(135deg, #0C3A57 0%, #15517a 58%, #8DBB01 100%)",
                    boxShadow: "0 16px 30px rgba(12, 58, 87, 0.26)",
                    opacity: saving || !appointment.date || !appointment.time || closureInfo ? 0.72 : 1,
                  }}
                >
                  {saving ? "Saving Appointment..." : "Create Appointment"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

function SectionCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        padding: "22px",
        borderRadius: "22px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(245,248,251,0.94))",
        border: "1px solid rgba(15, 20, 25, 0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--navy)", marginBottom: "6px" }}>
          {title}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{subtitle}</div>
      </div>
      <div style={{ display: "grid", gap: "16px" }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--navy)", letterSpacing: "0.01em" }}>
        {label}
      </span>
      {children}
    </label>
  );
}

const fieldStyle = {
  width: "100%",
  borderRadius: "16px",
  border: "1px solid rgba(22, 32, 43, 0.1)",
  background: "rgba(255,255,255,0.95)",
  padding: "14px 16px",
  fontSize: "14px",
  color: "var(--navy)",
  boxSizing: "border-box",
  boxShadow: "0 1px 0 rgba(255,255,255,0.8) inset",
};

const slotGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "12px",
};

const slotButtonStyle = {
  display: "grid",
  gap: "6px",
  padding: "14px 12px",
  borderRadius: "16px",
  border: "1px solid rgba(22, 32, 43, 0.08)",
  background: "rgba(255,255,255,0.96)",
  color: "var(--navy)",
  cursor: "pointer",
  textAlign: "left",
  boxShadow: "0 10px 24px rgba(12, 58, 87, 0.06)",
};

const selectedSlotButtonStyle = {
  background: "linear-gradient(135deg, #0C3A57 0%, #15517a 58%, #8DBB01 100%)",
  color: "#fffdf8",
  border: "1px solid rgba(22, 32, 43, 0.2)",
};

const disabledSlotButtonStyle = {
  cursor: "not-allowed",
  opacity: 0.42,
  boxShadow: "none",
};

const slotInfoStyle = {
  padding: "14px 16px",
  borderRadius: "16px",
  background: "rgba(255, 255, 255, 0.95)",
  color: "var(--text-muted)",
  fontSize: "13px",
  lineHeight: 1.6,
};

export default AddAppointment;
