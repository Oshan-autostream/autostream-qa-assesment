import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import api, { buildAssetUrl } from "../../../api/axios";
import { useToast } from "../../../components/ToastProvider";
import CustomerAppointmentForm from "./CustomerAppointmentForm";
import { getAuth } from "../../../utils/auth";
import { validateCustomerAppointment } from "../../../utils/validation";

export default function CustomerBookAppointment() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const auth = getAuth();
  const role = auth?.role;
  const isStaffBooking = ["admin", "staff"].includes(role);
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const res = await api.get("/vehicles");
        const available = res.data.filter((vehicle) => vehicle.status === "available");
        setVehicles(available);

        if (state?.vehicleId) {
          setVehicleId(state.vehicleId);
        } else if (available.length > 0) {
          setVehicleId(available[0]._id);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load vehicles", "Load failed");
      }
    };

    loadVehicles();
  }, [state, toast]);

  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!date) {
        setAvailableSlots([]);
        setClosureInfo(null);
        setTime("");
        return;
      }

      setLoading(true);
      setError("");
      setTime("");

      try {
        const endpoint = isStaffBooking
          ? `/appointments/available-slots/${date}`
          : `/customer/appointments/available-slots/${date}`;
        const res = await api.get(endpoint);
        const closure = res.data?.closure || null;
        const slots = res.data.slots || [];
        setClosureInfo(closure);
        if (closure) {
          setAvailableSlots([]);
        } else if (slots.length === 0) {
          setError("No available slots on this date. Please select another date.");
          setAvailableSlots([]);
        } else {
          setAvailableSlots(slots);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || err.response?.data?.errors?.[0] || "Failed to load available slots";
        setClosureInfo(null);
        setError(errorMsg);
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    loadTimeSlots();
  }, [date, isStaffBooking]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle._id === vehicleId),
    [vehicleId, vehicles]
  );

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    setTime("");
    setError("");
    setClosureInfo(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateCustomerAppointment({ vehicleId, date, time, minDate });
    if (validationMessage) {
      toast.error(validationMessage, "Appointment form");
      return;
    }

    try {
      const payload = { vehicle: vehicleId, date, time };
      if (isStaffBooking) {
        await api.post("/appointments/add", payload);
        toast.success("Appointment created");
        navigate("/appointments");
      } else {
        await api.post("/customer/appointments/book", payload);
        toast.success("Appointment booked");
        navigate("/my-appointments");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Booking failed", "Booking failed");
    }
  };

  const vehicleField = (
    <div style={{ display: "grid", gap: "16px" }}>
      <div>
        <label className="label">Vehicle</label>
        <select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="select" required>
          {vehicles.length === 0 ? (
            <option value="">No available vehicles</option>
          ) : (
            vehicles.map((vehicle) => (
              <option key={vehicle._id} value={vehicle._id}>
                {vehicle.brand} {vehicle.model || vehicle.type || ""} ({vehicle.year})
              </option>
            ))
          )}
        </select>
      </div>
      {selectedVehicle ? (
        <div className="card" style={{ overflow: "hidden", background: "rgba(255,255,255,0.9)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "0", alignItems: "stretch" }}>
            <div style={{ minHeight: "170px", background: "rgba(12,58,87,0.08)" }}>
              {selectedVehicle.images?.[0]?.url ? (
                <img
                  src={buildAssetUrl(selectedVehicle.images[0].url)}
                  alt={selectedVehicle.brand}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--text-muted)", fontWeight: 700 }}>
                  No Photo
                </div>
              )}
            </div>

            <div className="cardPad" style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--navy)", letterSpacing: "-0.03em" }}>
                    {selectedVehicle.brand} {selectedVehicle.model || selectedVehicle.type || ""}
                  </div>
                  <div className="sub">{selectedVehicle.type || "Vehicle"} • {selectedVehicle.year || "Year not set"}</div>
                </div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--primary)" }}>
                  LKR {Number(selectedVehicle.price || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "grid", gap: "8px" }}>
                <VehicleInfoRow label="Condition" value={selectedVehicle.condition || "Not specified"} />
                <VehicleInfoRow
                  label="Details"
                  value={selectedVehicle.details ? `${selectedVehicle.details.slice(0, 68)}${selectedVehicle.details.length > 68 ? "..." : ""}` : "Showroom vehicle"}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const sidePanel = (
    <div style={{ display: "grid", gap: "14px" }}>
      <div className="sectionTitle" style={{ fontSize: "16px" }}>What to Expect</div>
      <div style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
        Your booking reserves a one-hour session with available staff, giving you time to inspect the vehicle properly and ask questions without rush.
      </div>
      <div style={{ display: "grid", gap: "10px" }}>
        <VehicleInfoRow label="Arrival" value="Please arrive 10 minutes early" />
        <VehicleInfoRow label="Hours" value="9:00 AM to 5:00 PM" />
        <VehicleInfoRow label="Support" value="Confirmed against staff capacity" />
      </div>
    </div>
  );

  return (
    <CustomerAppointmentForm
      title=""
      subtitle=""
      vehicleField={vehicleField}
      sidePanel={sidePanel}
      date={date}
      setDate={setDate}
      onDateChange={handleDateChange}
      minDate={minDate}
      availableSlots={availableSlots}
      loading={loading}
      error={error}
      closureInfo={closureInfo}
      time={time}
      setTime={setTime}
      submit={submit}
      submitLabel={isStaffBooking ? "Create Appointment" : "Book Appointment"}
      cancelLabel="Cancel"
      onCancel={() => navigate(isStaffBooking ? "/appointments" : "/")}
      selectedVehicleLabel={
        selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model || selectedVehicle.type || ""}` : "Showroom visit"
      }
    />
  );
}

function VehicleInfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start" }}>
      <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", minWidth: "88px" }}>
        {label}
      </div>
      <div style={{ textAlign: "right", color: "var(--text)", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
