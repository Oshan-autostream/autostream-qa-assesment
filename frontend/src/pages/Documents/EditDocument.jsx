import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { updateDoc } from "../../api/documentApi";

const DOC_TYPES = ["RC_BOOK", "INSURANCE", "TRANSFER_FORM", "EMISSION", "SERVICE_BOOK", "OTHER"];
const DOC_STATUSES = ["AVAILABLE", "IN_USE", "MISSING", "ARCHIVED"];

export default function EditDocument() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const getVehicleNumber = (vehicle) =>
    vehicle?.vehicleNumber || vehicle?.vehicle_number || vehicle?.registrationNo || vehicle?.regNo || "";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const [docRes, vehicleRes] = await Promise.all([api.get(`/documents/${id}`), api.get("/vehicles")]);
        const doc = docRes.data;
        setForm({
          title: doc.title || "",
          docType: doc.docType || "RC_BOOK",
          referenceNo: doc.referenceNo || "",
          vehicle: doc.vehicle?._id || "",
          status: doc.status || "AVAILABLE",
          location: doc.location || "",
          notes: doc.notes || "",
        });
        setVehicles(vehicleRes.data || []);
      } catch (err) {
        const status = err.response?.status;
        const msg = err.response?.data?.message || err.message;
        setLoadError(`Failed to load document. (${status || "no status"}) ${msg}`);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(id, {
        ...form,
        vehicle: form.vehicle || undefined,
      });
      navigate("/documents");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
        Loading document...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page">
        <div style={{ maxWidth: "760px", margin: "40px auto", color: "var(--danger)" }}>
          {loadError}
        </div>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Edit Document</div>
        </div>
      </div>

      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div style={{ display: "grid", gap: "10px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--primary)", fontWeight: 700 }}>
            Document Editor
          </div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--navy)" }}>Refine document details</div>
          <div style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>
            Keep storage, status, and vehicle references accurate for day-to-day operations.
          </div>
        </div>

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
              <input value={form.referenceNo} onChange={(e) => setForm({ ...form, referenceNo: e.target.value })} className="input" />
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
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" required />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} className="textarea" />
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button type="button" onClick={() => navigate("/documents")} className="btn" style={{ flex: 1 }}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" style={{ flex: 1 }}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
