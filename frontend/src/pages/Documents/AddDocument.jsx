import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc } from "../../api/documentApi";
import api from "../../api/axios";

const DOC_TYPES = ["RC_BOOK", "INSURANCE", "TRANSFER_FORM", "EMISSION", "SERVICE_BOOK", "OTHER"];
const DOC_STATUSES = ["AVAILABLE", "IN_USE", "MISSING", "ARCHIVED"];

export default function AddDocument() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    docType: "RC_BOOK",
    referenceNo: "",
    vehicle: "",
    status: "AVAILABLE",
    location: "",
    notes: "",
  });

  const getVehicleNumber = (vehicle) =>
    vehicle?.vehicleNumber || vehicle?.vehicle_number || vehicle?.registrationNo || vehicle?.regNo || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const vRes = await api.get("/vehicles");
        setVehicles(vRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load vehicles");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await addDoc({
        title: form.title,
        docType: form.docType,
        referenceNo: form.referenceNo,
        status: form.status,
        location: form.location,
        notes: form.notes,
        vehicle: form.vehicle || undefined,
      });
      navigate("/documents");
    } catch (err) {
      setError(err.response?.data?.message || "Add failed");
    }
  };

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Add Document</div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", fontWeight: 700 }}>
            New Record
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy)" }}>Add a document entry</div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Keep document metadata concise and easy to maintain across your vehicle inventory.
          </div>
        </div>

        {loading ? (
          <div style={{ marginBottom: "20px", color: "var(--text-muted)" }}>Loading vehicles...</div>
        ) : null}

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
            <div>
              <label className="label">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Document Type</label>
                <select value={form.docType} onChange={(e) => setForm({ ...form, docType: e.target.value })} className="select">
                  {DOC_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select">
                  {DOC_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label">Reference Number</label>
              <input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} className="input" placeholder="Optional internal reference" />
            </div>

            <div>
              <label className="label">Vehicle</label>
              <select value={form.vehicle} onChange={(e) => setForm({ ...form, vehicle: e.target.value })} className="select">
                <option value="">Unassigned</option>
                {vehicles.map((vehicle) => {
                  const vehicleNumber = getVehicleNumber(vehicle);
                  return (
                    <option key={vehicle._id} value={vehicle._id}>
                      {vehicle.brand} {vehicle.type || ""} ({vehicle.year}){vehicleNumber ? ` - ${vehicleNumber}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="label">Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" required placeholder="Cabinet, shelf, or storage reference" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="textarea" placeholder="Optional handling or storage notes" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={() => navigate("/documents")} className="btn" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" style={{ flex: 1 }}>
              Save Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
