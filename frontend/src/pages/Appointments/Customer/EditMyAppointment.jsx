import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useToast } from "../../../components/ToastProvider";
import CustomerAppointmentForm from "./CustomerAppointmentForm";
import { validateCustomerAppointment } from "../../../utils/validation";

export default function EditMyAppointment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [closureInfo, setClosureInfo] = useState(null);
  const [minDate, setMinDate] = useState("");
  const [appointment, setAppointment] = useState(null);

  useEffect(() => {
    setMinDate(new Date().toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    api
      .get(`/customer/appointments/my`)
      .then((res) => {
        const found = res.data.find((item) => item._id === id);
        if (!found) {
          toast.error("Appointment not found", "Load failed");
          navigate("/my-appointments");
          return;
        }
        setAppointment(found);
        setDate(String(found.date).slice(0, 10));
        setTime(found.time);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to load", "Load failed");
      });
  }, [id, navigate, toast]);

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

      try {
        const res = await api.get(`/customer/appointments/available-slots/${date}?excludeAppointmentId=${id}`);
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
  }, [date, id]);

  const handleDateChange = (nextDate) => {
    setDate(nextDate);
    setTime("");
    setError("");
    setClosureInfo(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateCustomerAppointment({ vehicleId: appointment?.vehicle?._id || "existing", date, time, minDate });
    if (validationMessage) {
      toast.error(validationMessage, "Appointment form");
      return;
    }

    try {
      await api.put(`/customer/appointments/${id}`, { date, time });
      toast.success("Appointment updated");
      navigate("/my-appointments");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed", "Update failed");
    }
  };

  if (!appointment) return <p style={{ padding: 20 }}>Loading...</p>;

  const vehicleField = (
    <div style={{ background: "rgba(255,255,255,0.86)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--navy)" }}>
            {appointment.vehicle?.brand} {appointment.vehicle?.model || appointment.vehicle?.type || ""}
          </div>
          <div className="sub">{appointment.vehicle?.type || "Vehicle"} • {appointment.vehicle?.year || "Year not set"}</div>
        </div>
        <span className="badge badgeCyan">Reschedule</span>
      </div>
    </div>
  );

  return (
    <CustomerAppointmentForm
      title="Edit My Appointment"
      subtitle=""
      vehicleField={vehicleField}
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
      submitLabel="Update Appointment"
      cancelLabel="Back"
      onCancel={() => navigate("/my-appointments")}
      selectedVehicleLabel={`${appointment.vehicle?.brand || ""} ${appointment.vehicle?.model || appointment.vehicle?.type || ""}`.trim()}
    />
  );
}
