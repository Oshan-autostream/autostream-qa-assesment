import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import eventApi from "../../api/eventApi";
const EVENT_TYPES = [
  { value: "holiday", label: "Holiday" },
  { value: "weather", label: "Weather Issue" },
  { value: "flood", label: "Flood / Disaster" },
  { value: "special", label: "Special Closure" },
  { value: "other", label: "Other" },
];

export default function EditEvent() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "holiday",
    description: "",
    startDate: "",
    endDate: "",
    isShopClosed: true,
  });

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      const event = await eventApi.getEvent(id);
      setFormData({
        name: event.name,
        type: event.type,
        description: event.description || "",
        startDate: new Date(event.startDate).toISOString().split("T")[0],
        endDate: new Date(event.endDate).toISOString().split("T")[0],
        isShopClosed: event.isShopClosed,
      });
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to fetch event";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) return setError("Event name is required");
    if (!formData.startDate) return setError("Start date is required");
    if (!formData.endDate) return setError("End date is required");
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return setError("End date must be on or after start date");
    }

    try {
      setSubmitting(true);
      await eventApi.updateEvent(id, formData);
      navigate("/events");
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Failed to update event";
      const details = err.response?.data?.details;
      setError(details ? `${errorMsg}: ${details.join(", ")}` : errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        Loading event...
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHead">
        <div className="pageHeadLeft">
          <h1 className="h1">Edit Event</h1>
        </div>
      </div>

      <div className="eventFormCard" style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", fontWeight: 700 }}>
            Event Editor
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy)" }}>Update event details</div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Keep the event concise, clear, and visually consistent with the rest of the operations dashboard.
          </div>
        </div>

        {error ? (
          <div
            style={{
              marginBottom: "22px",
              padding: "14px 16px",
              borderRadius: "16px",
              border: "1px solid rgba(186, 94, 94, 0.18)",
              background: "var(--surface-strong)",
              color: "var(--danger)",
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "22px" }}>
          <div style={{ display: "grid", gap: "18px" }}>
            <div>
              <label className="label">Event Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="input" />
            </div>

            <div>
              <label className="label">Event Type</label>
              <select name="type" value={formData.type} onChange={handleChange} className="select">
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">End Date</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="input" min={formData.startDate || undefined} />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="textarea" style={{ minHeight: "120px" }} />
            </div>
          </div>

          <div className="eventDateCard" style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <input
              type="checkbox"
              name="isShopClosed"
              id="isShopClosed"
              checked={formData.isShopClosed}
              onChange={handleChange}
              style={{ width: "18px", height: "18px", marginTop: "2px" }}
            />
            <label htmlFor="isShopClosed" style={{ cursor: "pointer", margin: 0 }}>
              <div style={{ color: "var(--navy)", fontWeight: 700, marginBottom: "4px" }}>Shop is closed</div>
              <div style={{ color: "var(--text-muted)", fontSize: "13px", lineHeight: 1.6 }}>
                Appointments will be blocked during this event period.
              </div>
            </label>
          </div>

          <div style={{ display: "flex", gap: "12px", paddingTop: "6px" }}>
            <button type="button" className="btn" onClick={() => navigate("/events")} disabled={submitting} style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
