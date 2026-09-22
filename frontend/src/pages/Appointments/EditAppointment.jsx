import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";

const getTomorrowDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDisplayTime = (time) => {
  if (!time) return "Select a session";
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
};

export default function EditAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState({
    lead: "",
    vehicle: "",
    appointmentType: "viewing",
    date: "",
    time: "",
    status: "scheduled",
    notes: "",
  });
  const [leads, setLeads] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [apptRes, leadRes, vehicleRes] = await Promise.all([
          api.get(`/appointments/${id}`),
          api.get("/leads"),
          api.get("/vehicles"),
        ]);

        const item = apptRes.data;
        setAppointment({
          lead: item.lead?._id || item.lead || "",
          vehicle: item.vehicle?._id || item.vehicle || "",
          appointmentType: item.appointmentType || "viewing",
          date: item.date ? String(item.date).slice(0, 10) : "",
          time: item.time || "",
          status: item.status || "scheduled",
          notes: item.notes || "",
        });
        setLeads(Array.isArray(leadRes.data) ? leadRes.data : []);
        setVehicles(Array.isArray(vehicleRes.data) ? vehicleRes.data : []);
      } catch (err) {
        alert(err.response?.data?.message || "Failed to load appointment");
        navigate("/appointments");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, navigate]);

  useEffect(() => {
    const loadSlots = async () => {
      if (!appointment.date) {
        setAvailableSlots([]);
        setClosureInfo(null);
        return;
      }

      try {
        const res = await api.get(`/appointments/available-slots/${appointment.date}?excludeAppointmentId=${id}`);
        setClosureInfo(res.data?.closure || null);
        setAvailableSlots(res.data?.slots || []);
      } catch (err) {
        setClosureInfo(null);
        setAvailableSlots([]);
        setError(err.response?.data?.message || "Failed to load available sessions");
      }
    };

    loadSlots();
  }, [appointment.date, id]);

  const selectedLead = useMemo(() => leads.find((lead) => lead._id === appointment.lead), [leads, appointment.lead]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAppointment((current) => ({
      ...current,
      [name]: value,
      ...(name === "date" ? { time: "" } : {}),
    }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!appointment.date || !appointment.time) {
      setError("Please choose a valid future date and one available hourly session");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await api.put(`/appointments/${id}`, appointment);
      navigate("/appointments");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Edit Appointment</div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", fontWeight: 700 }}>
            Appointment Editor
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy)" }}>Refine booking details</div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Keep the schedule accurate with future-only hourly sessions and clear appointment notes.
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: "22px",
              padding: "14px 16px",
              borderRadius: "16px",
              border: "1px solid rgba(186, 94, 94, 0.18)",
              background: "rgba(255,255,255,0.92)",
              color: "var(--danger)",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} style={{ display: "grid", gap: "22px" }}>
          <div style={{ display: "grid", gap: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Lead</label>
                <select name="lead" value={appointment.lead} onChange={handleChange} required className="select" disabled={loading || saving}>
                  <option value="">Select Lead</option>
                  {leads.map((lead) => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Vehicle</label>
                <select name="vehicle" value={appointment.vehicle} onChange={handleChange} required className="select" disabled={loading || saving}>
                  <option value="">Select Vehicle</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.brand} {vehicle.model || vehicle.type || ""} ({vehicle.year})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Appointment Type</label>
                <select name="appointmentType" value={appointment.appointmentType} onChange={handleChange} className="select" disabled={saving}>
                  <option value="viewing">Viewing</option>
                  <option value="test_drive">Test Drive</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>

              <div>
                <label className="label">Status</label>
                <select name="status" value={appointment.status} onChange={handleChange} className="select" disabled={saving}>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Date</label>
              <input type="date" name="date" value={appointment.date} onChange={handleChange} required min={getTomorrowDateString()} className="input" disabled={saving} />
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                Daily sessions run hourly from 9:00 AM to 5:00 PM.
              </div>
            </div>

            <div>
              <label className="label">Available Sessions</label>
              {closureInfo ? (
                <div
                  style={{
                    marginTop: "8px",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    border: "1px solid rgba(186, 94, 94, 0.18)",
                    background: "rgba(255,255,255,0.92)",
                    color: "var(--danger)",
                    fontWeight: 600,
                    lineHeight: 1.6,
                  }}
                >
                  {closureInfo.message}
                </div>
              ) : appointment.date ? (
                availableSlots.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginTop: "8px" }}>
                    {availableSlots.map((slot) => {
                      const selected = appointment.time === slot.time;
                      const disabled = slot.availableStaffCount === 0;
                      return (
                        <button
                          key={slot.time}
                          type="button"
                          onClick={() => !disabled && setAppointment((current) => ({ ...current, time: slot.time }))}
                          disabled={disabled || saving}
                          className="btn"
                          style={{
                            padding: "12px 10px",
                            borderRadius: "16px",
                            background: selected ? "linear-gradient(135deg, #0C3A57 0%, #15517a 58%, #8DBB01 100%)" : "rgba(255,255,255,0.92)",
                            color: selected ? "#fff" : "var(--navy)",
                            border: selected ? "1px solid transparent" : "1px solid var(--border)",
                            opacity: disabled ? 0.45 : 1,
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                        >
                          <div style={{ fontWeight: 700 }}>{formatDisplayTime(slot.time)}</div>
                          <div style={{ fontSize: "12px", marginTop: "4px" }}>{slot.availableStaffCount} staff available</div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: "8px", color: "var(--text-muted)" }}>
                    No sessions available on this date.
                  </div>
                )
              ) : (
                <div style={{ marginTop: "8px", color: "var(--text-muted)" }}>
                  Select a date to see available sessions.
                </div>
              )}
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea name="notes" value={appointment.notes} onChange={handleChange} rows={4} className="textarea" placeholder="Add any internal notes for this booking" disabled={saving} />
            </div>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: "18px",
              border: "1px solid var(--border)",
              background: "rgba(236, 236, 236, 0.42)",
              color: "var(--text-secondary)",
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: "var(--navy)" }}>{selectedLead?.name || "Selected lead"}</strong> is booked for{" "}
            <strong style={{ color: "var(--navy)" }}>{formatDisplayTime(appointment.time)}</strong> on{" "}
            <strong style={{ color: "var(--navy)" }}>{appointment.date || "a future date"}</strong>.
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={() => navigate("/appointments")} className="btn" disabled={saving} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={saving || !appointment.date || !appointment.time || Boolean(closureInfo)} style={{ flex: 1 }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
