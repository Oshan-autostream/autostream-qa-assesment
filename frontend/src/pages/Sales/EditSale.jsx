import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getSaleById, updateSale } from "../../api/saleApi";
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
        <div className="sub">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function SummaryTile({ label, value, tone = "var(--text)", inverse = false }) {
  return (
    <div
      style={{
        border: inverse ? "1px solid rgba(255,255,255,0.16)" : "1px solid var(--border)",
        borderRadius: "16px",
        padding: "16px",
        background: inverse ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.72)",
        display: "grid",
        gap: "6px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: inverse ? "rgba(255,255,255,0.74)" : "var(--text-muted)",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: 700, color: tone }}>{value}</div>
    </div>
  );
}

export default function EditSale() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = getAuth();
  const canManage = role === "admin" || role === "staff";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sale, setSale] = useState(null);
  const [form, setForm] = useState({
    price: "",
    paid_amount: "0",
    payment_method: "",
    payment_reference: "",
    bank_name: "",
    cheque_number: "",
    payment_date: "",
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
        const response = await getSaleById(id);
        const currentSale = response.data;
        setSale(currentSale);
        setForm({
          price: currentSale.price != null ? String(currentSale.price) : "",
          paid_amount: currentSale.paid_amount != null ? String(currentSale.paid_amount) : "0",
          payment_method: currentSale.payment_method || "",
          payment_reference: currentSale.payment_reference || "",
          bank_name: currentSale.bank_name || "",
          cheque_number: currentSale.cheque_number || "",
          payment_date: formatDateInput(currentSale.payment_date),
          payment_details: currentSale.payment_details || "",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load sale");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, canManage, navigate]);

  const numericPrice = Number(form.price || 0);
  const numericPaid = Number(form.paid_amount || 0);
  const pendingAmount = Math.max(numericPrice - numericPaid, 0);
  const paymentStatus = useMemo(() => derivePaymentStatus(numericPrice, numericPaid), [numericPrice, numericPaid]);
  const statusMeta = getStatusMeta(paymentStatus);
  const paymentFieldsVisible = numericPaid > 0;
  const requiresReference = form.payment_method === "bank_transfer";
  const requiresChequeNumber = form.payment_method === "cheque";

  const onChange = (event) => {
    const { name, value } = event.target;

    if (name === "cheque_number") {
      setForm((current) => ({ ...current, cheque_number: normalizeChequeNumber(value) }));
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

    if (form.price === "" || numericPrice < 0) return setError("Price must be 0 or more");
    if (numericPaid < 0) return setError("Paid amount must be 0 or more");
    if (numericPaid > numericPrice) return setError("Paid amount cannot be greater than the full price");
    if (paymentFieldsVisible && !form.payment_method) return setError("Please select a payment method");
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
      await updateSale(id, {
        price: numericPrice,
        paid_amount: numericPaid,
        payment_method: paymentFieldsVisible ? form.payment_method : "",
        payment_reference: paymentFieldsVisible ? form.payment_reference.trim() : "",
        bank_name: paymentFieldsVisible ? form.bank_name.trim() : "",
        cheque_number: paymentFieldsVisible ? form.cheque_number.trim() : "",
        payment_date: paymentFieldsVisible ? form.payment_date : null,
        payment_details: paymentFieldsVisible ? form.payment_details.trim() : "",
      });

      alert("Sale updated successfully");
      navigate("/sales");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p style={{ padding: 20 }}>Loading...</p>;

  if (error && !sale) {
    return (
      <div className="page">
        <div style={{ maxWidth: "760px", margin: "40px auto", color: "var(--danger)" }}>
          {error}
          <button onClick={() => navigate("/sales")} className="btn" style={{ marginTop: "14px" }}>
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="pageHead">
        <div>
          <div className="pageTitle">Edit Sale</div>
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
          <SectionCard title="Sale Summary" subtitle="Core transaction details stay visible while you update the payment record.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
              <SummaryTile
                label="Vehicle"
                value={`${sale?.vehicle?.brand || ""} ${sale?.vehicle?.model || sale?.vehicle?.type || ""}`.trim() || "Not available"}
              />
              <SummaryTile label="Customer" value={sale?.customer?.name || "Not available"} />
              <SummaryTile label="Registered" value={getVehicleNumber(sale?.vehicle)} />
            </div>
          </SectionCard>

          <SectionCard title="Amounts" subtitle="Adjust the sale price or record additional money received from the customer.">
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

          <SectionCard title="Payment Details" subtitle="Store the reference number, transfer details, or cheque information with the latest update.">
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
            <button type="submit" className="btn btnPrimary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
