import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { addSale } from "../../api/saleApi";
import { getAuth } from "../../utils/auth";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];
const CHEQUE_NUMBER_PATTERN = /^\d+$/;

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString()}`;
}

function formatDateInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function derivePaymentStatus(price, paidAmount) {
  if (paidAmount <= 0) return "pending";
  if (paidAmount >= price) return "completed";
  return "partial";
}

function getVehicleNumber(vehicle) {
  return vehicle?.vehicleNumber || vehicle?.registration_number || "No registration";
}

function getStatusMeta(status) {
  if (status === "completed") return { label: "Completed", badge: "badge badgeGreen" };
  if (status === "partial") return { label: "Partial", badge: "badge badgeOrange" };
  return { label: "Pending", badge: "badge badgePink" };
}

function normalizeChequeNumber(value) {
  return String(value || "").replace(/\D/g, "");
}

function SectionCard({ title, subtitle, children }) {
  return (
    <div style={{ display: "grid", gap: "18px" }}>
      <div>
        <div className="sectionTitle">{title}</div>
        <div className="sub" style={{ maxWidth: "560px" }}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

export default function AddSale() {
  const navigate = useNavigate();
  const { role } = getAuth();
  const canManage = role === "admin" || role === "staff";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    vehicle: "",
    customer: "",
    price: "",
    paid_amount: "0",
    payment_method: "",
    payment_reference: "",
    bank_name: "",
    cheque_number: "",
    payment_date: formatDateInput(new Date()),
    payment_details: "",
  });

  useEffect(() => {
    if (!canManage) {
      alert("Access denied");
      navigate("/vehicles");
      return;
    }

    const load = async () => {
      setError("");
      setLoading(true);
      try {
        const [vehiclesResponse, leadsResponse] = await Promise.all([api.get("/vehicles"), api.get("/leads")]);
        const availableVehicles = (vehiclesResponse.data || []).filter((vehicle) => vehicle.status === "available");
        const leadList = leadsResponse.data || [];

        setVehicles(availableVehicles);
        setLeads(leadList);
        setForm((current) => ({
          ...current,
          vehicle: availableVehicles[0]?._id || "",
          customer: leadList[0]?._id || "",
          price: availableVehicles[0]?.price ? String(availableVehicles[0].price) : current.price,
        }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load vehicles and customers");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canManage, navigate]);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle._id === form.vehicle),
    [vehicles, form.vehicle]
  );

  const selectedLead = useMemo(
    () => leads.find((lead) => lead._id === form.customer),
    [leads, form.customer]
  );

  const numericPrice = Number(form.price || 0);
  const numericPaid = Number(form.paid_amount || 0);
  const pendingAmount = Math.max(numericPrice - numericPaid, 0);
  const paymentStatus = derivePaymentStatus(numericPrice, numericPaid);
  const statusMeta = getStatusMeta(paymentStatus);
  const requiresReference = form.payment_method === "bank_transfer";
  const requiresChequeNumber = form.payment_method === "cheque";
  const paymentFieldsVisible = numericPaid > 0;

  const onChange = (event) => {
    const { name, value } = event.target;

    if (name === "cheque_number") {
      setForm((current) => ({ ...current, cheque_number: normalizeChequeNumber(value) }));
      return;
    }

    if (name === "vehicle") {
      const vehicle = vehicles.find((item) => item._id === value);
      setForm((current) => ({
        ...current,
        vehicle: value,
        price: vehicle?.price ? String(vehicle.price) : current.price,
      }));
      return;
    }

    if (name === "paid_amount" && Number(value || 0) <= 0) {
      setForm((current) => ({
        ...current,
        paid_amount: value,
        payment_method: "",
        payment_reference: "",
        bank_name: "",
        cheque_number: "",
        payment_details: "",
      }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.vehicle) return setError("Please select a vehicle");
    if (!form.customer) return setError("Please select a customer");
    if (form.price === "" || numericPrice < 0) return setError("Price must be 0 or more");
    if (numericPaid < 0) return setError("Paid amount must be 0 or more");
    if (numericPaid > numericPrice) return setError("Paid amount cannot be greater than the full price");
    if (numericPaid > 0 && !form.payment_method) return setError("Please select a payment method");
    if (requiresReference && !form.payment_reference.trim()) {
      return setError("Payment reference is required for bank transfers");
    }
    if (requiresChequeNumber && !form.cheque_number.trim()) {
      return setError("Cheque number is required for cheque payments");
    }
    if (requiresChequeNumber && !CHEQUE_NUMBER_PATTERN.test(form.cheque_number.trim())) {
      return setError("Cheque number must contain numbers only");
    }

    setSaving(true);
    try {
      await addSale({
        vehicle: form.vehicle,
        customer: form.customer,
        price: numericPrice,
        paid_amount: numericPaid,
        payment_method: paymentFieldsVisible ? form.payment_method : "",
        payment_reference: paymentFieldsVisible ? form.payment_reference.trim() : "",
        bank_name: paymentFieldsVisible ? form.bank_name.trim() : "",
        cheque_number: paymentFieldsVisible ? form.cheque_number.trim() : "",
        payment_date: paymentFieldsVisible ? form.payment_date : null,
        payment_details: paymentFieldsVisible ? form.payment_details.trim() : "",
      });

      alert("Sale saved successfully");
      navigate("/sales");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save sale");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">New Sale</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: "20px", maxWidth: "960px", margin: "0 auto" }}>
        {error && (
          <div
           
            style={{ borderColor: "rgba(186, 94, 94, 0.35)", color: "var(--danger)", background: "rgba(255,255,255,0.94)" }}
          >
            {error}
          </div>
        )}

        <form onSubmit={submit} style={{ display: "grid", gap: "20px" }}>
          <SectionCard title="Transaction" subtitle="Choose the vehicle and the customer tied to this sale.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Vehicle</label>
                <select className="select" name="vehicle" value={form.vehicle} onChange={onChange} disabled={!vehicles.length} required>
                  {vehicles.length === 0 ? (
                    <option value="">No available vehicles</option>
                  ) : (
                    vehicles.map((vehicle) => (
                      <option key={vehicle._id} value={vehicle._id}>
                        {vehicle.brand} {vehicle.model || vehicle.type || ""} ({vehicle.year || "N/A"})
                      </option>
                    ))
                  )}
                </select>
                {selectedVehicle && (
                  <div className="sub" style={{ marginTop: "8px" }}>
                    {getVehicleNumber(selectedVehicle)} • {formatCurrency(selectedVehicle.price || 0)}
                  </div>
                )}
              </div>

              <div>
                <label className="label">Customer</label>
                <select className="select" name="customer" value={form.customer} onChange={onChange} disabled={!leads.length} required>
                  {leads.length === 0 ? (
                    <option value="">No customers available</option>
                  ) : (
                    leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name} {lead.contact_number ? `• ${lead.contact_number}` : ""}
                      </option>
                    ))
                  )}
                </select>
                {selectedLead && (
                  <div className="sub" style={{ marginTop: "8px" }}>
                    {selectedLead.email || "No email"} {selectedLead.interested_vehicle ? `• Interested in ${selectedLead.interested_vehicle}` : ""}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Amounts" subtitle="Record the agreed price and how much has already been collected.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <div>
                <label className="label">Sale Price</label>
                <input className="input" type="number" min="0" name="price" value={form.price} onChange={onChange} required />
              </div>
              <div>
                <label className="label">Paid Amount</label>
                <input className="input" type="number" min="0" name="paid_amount" value={form.paid_amount} onChange={onChange} />
              </div>
              <div>
                <label className="label">Pending Amount</label>
                <input className="input" value={formatCurrency(pendingAmount)} readOnly />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Payment Details" subtitle="Keep the payment method and reference details ready for follow-up and audits.">
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="label">Payment Status</label>
                  <div
                    style={{
                      minHeight: "48px",
                      borderRadius: "14px",
                      border: "1px solid var(--border)",
                      padding: "0 16px",
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.74)",
                    }}
                  >
                    <span className={statusMeta.badge}>{statusMeta.label}</span>
                  </div>
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    className="select"
                    name="payment_method"
                    value={form.payment_method}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                  >
                    <option value="">Select payment method</option>
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="label">Payment Date</label>
                  <input
                    className="input"
                    type="date"
                    name="payment_date"
                    value={form.payment_date}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                  />
                </div>
                <div>
                  <label className="label">Reference Number</label>
                  <input
                    className="input"
                    name="payment_reference"
                    value={form.payment_reference}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                    placeholder={requiresReference ? "Required for transfer" : "Transaction reference"}
                  />
                </div>
                <div>
                  <label className="label">Bank Name</label>
                  <input
                    className="input"
                    name="bank_name"
                    value={form.bank_name}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                    placeholder="Optional bank name"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
                <div>
                  <label className="label">Cheque Number</label>
                  <input
                    className="input"
                    name="cheque_number"
                    value={form.cheque_number}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder={requiresChequeNumber ? "Required for cheque" : "Optional cheque number"}
                  />
                  <div className="sub" style={{ marginTop: "8px" }}>
                    Numbers only. Letters and symbols are not allowed.
                  </div>
                </div>
                <div>
                  <label className="label">Additional Details</label>
                  <input
                    className="input"
                    name="payment_details"
                    value={form.payment_details}
                    onChange={onChange}
                    disabled={!paymentFieldsVisible}
                    placeholder="Notes, branch info, collector name, or internal remarks"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
            <button type="button" className="btn" onClick={() => navigate("/sales")} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btnPrimary" disabled={saving || !vehicles.length}>
              {saving ? "Saving..." : "Save Sale"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
