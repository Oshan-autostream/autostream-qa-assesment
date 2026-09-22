import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import eventApi from "../../api/eventApi";
import { getAuth } from "../../utils/auth";

const FILTERS = ["all", "holiday", "weather", "flood", "special", "other"];

const EVENT_TYPE_STYLES = {
  holiday: { bg: "rgba(141, 187, 1, 0.12)", color: "#8DBB01", label: "Holiday" },
  weather: { bg: "rgba(12, 58, 87, 0.08)", color: "#0C3A57", label: "Weather" },
  flood: { bg: "rgba(61, 143, 165, 0.12)", color: "#3d8fa5", label: "Flood" },
  special: { bg: "rgba(109, 127, 160, 0.12)", color: "#6d7fa0", label: "Special" },
  other: { bg: "rgba(212, 138, 58, 0.12)", color: "#d48a3a", label: "Other" },
};

export default function EventList() {
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUserId = auth?.user?.id || auth?.user?._id || "";
  const isAdmin = auth?.role === "admin";
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, eventId: null, eventName: "" });
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await eventApi.getAllEvents();
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.eventId) return;

    try {
      await eventApi.deleteEvent(deleteDialog.eventId);
      setEvents((current) => current.filter((event) => event._id !== deleteDialog.eventId));
      setDeleteDialog({ open: false, eventId: null, eventName: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const filteredEvents = useMemo(
    () => (filter === "all" ? events : events.filter((event) => event.type === filter)),
    [events, filter]
  );

  const stats = useMemo(() => {
    const closed = events.filter((event) => event.isShopClosed).length;
    const holidays = events.filter((event) => event.type === "holiday").length;
    const active = events.length;
    return { active, closed, holidays };
  }, [events]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="page">
      <div className="pageHead">
        <div className="pageHeadLeft">
          <h1 className="h1">Events</h1>
        </div>
        <button className="btn btnPrimary" onClick={() => navigate("/events/add")}>
          Add Event
        </button>
      </div>

      {error ? (
        <div
         
          style={{
            marginBottom: "20px",
            borderColor: "rgba(186, 94, 94, 0.2)",
            background: "rgba(255,255,255,0.9)",
            color: "var(--danger)",
          }}
        >
          {error}
        </div>
      ) : null}

      <div className="kpiGrid">
        <MetricCard label="Total Events" value={loading ? "—" : stats.active} sub="All scheduled items" />
        <MetricCard label="Shop Closures" value={loading ? "—" : stats.closed} sub="Booking unavailable days" />
        <MetricCard label="Holidays" value={loading ? "—" : stats.holidays} sub="Calendar-based closures" />
        <MetricCard label="Filtered" value={loading ? "—" : filteredEvents.length} sub={filter === "all" ? "Current full view" : `Showing ${filter}`} />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <div className="row" style={{ alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="sectionTitle">Browse Events</div>
            <div className="sub">Use filters to focus on the closures and operational notices you need.</div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginLeft: "auto" }}>
            {FILTERS.map((type) => (
              <button
                key={type}
                type="button"
                className={`btn ${filter === type ? "btnPrimary" : ""}`}
                onClick={() => setFilter(type)}
                style={!filter || filter !== type ? { background: "rgba(255,255,255,0.72)" } : undefined}
              >
                {type === "all" ? "All" : EVENT_TYPE_STYLES[type]?.label || type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          Loading events...
        </div>
      ) : filteredEvents.length === 0 ? (
        <div style={{ textAlign: "center", padding: "56px 24px", color: "var(--text-muted)" }}>
          {events.length === 0 ? "No events created yet." : "No events match this filter."}
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
          {filteredEvents.map((event) => {
            const typeStyle = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.other;
            const eventCreatorId =
              typeof event.createdBy === "string"
                ? event.createdBy
                : event.createdBy?._id || "";
            const canManageEvent = isAdmin || (currentUserId && currentUserId === eventCreatorId);
            return (
              <div key={event._id} className="eventCard" style={{ display: "grid", gap: "18px", width: "100%", maxWidth: "340px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", lineHeight: 1.15 }}>
                      {event.name}
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          padding: "6px 10px",
                          borderRadius: "999px",
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        {typeStyle.label}
                      </span>
                      {event.isShopClosed ? (
                        <span
                          style={{
                            padding: "6px 10px",
                            borderRadius: "999px",
                            background: "rgba(186, 94, 94, 0.12)",
                            color: "var(--danger)",
                            fontSize: "11px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          Shop Closed
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      borderRadius: "999px",
                      background: event.color || typeStyle.color,
                      boxShadow: `0 0 0 6px ${typeStyle.bg}`,
                      flexShrink: 0,
                      marginTop: "4px",
                    }}
                  />
                </div>

                <div className="eventDateCard" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <DateItem label="Start" value={formatDate(event.startDate)} />
                  <DateItem label="End" value={formatDate(event.endDate)} />
                </div>

                {event.description ? (
                  <div
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "14px",
                      lineHeight: 1.65,
                    }}
                  >
                    {event.description}
                  </div>
                ) : null}

                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Created by <strong style={{ color: "var(--navy)" }}>{event.createdBy?.name || "Unknown"}</strong>
                </div>

                {canManageEvent ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button className="btn btnPrimary" onClick={() => navigate(`/events/edit/${event._id}`)} style={{ flex: 1 }}>
                      Edit Event
                    </button>
                    <button
                      className="btn"
                      onClick={() =>
                        setDeleteDialog({
                          open: true,
                          eventId: event._id,
                          eventName: event.name,
                        })
                      }
                      style={{ flex: 1, color: "var(--danger)", borderColor: "rgba(186, 94, 94, 0.28)" }}
                    >
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {deleteDialog.open ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(12, 58, 87, 0.28)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 999,
          }}
        >
          <div className="eventFormCard" style={{ width: "100%", maxWidth: "420px" }}>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "var(--navy)", marginBottom: "10px" }}>Delete event?</div>
            <div style={{ color: "var(--text-muted)", lineHeight: 1.65, marginBottom: "22px" }}>
              Remove <strong style={{ color: "var(--navy)" }}>{deleteDialog.eventName}</strong> from your schedule. This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn" onClick={() => setDeleteDialog({ open: false, eventId: null, eventName: "" })} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn btnDanger" onClick={handleDelete} style={{ flex: 1 }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
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

function DateItem({ label, value }) {
  return (
    <div>
      <div style={{ color: "var(--text-muted)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ color: "var(--navy)", fontSize: "14px", fontWeight: 700 }}>{value}</div>
    </div>
  );
}
