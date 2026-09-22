import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { normalizeEmail, normalizePhoneNumber, validateLeadForm } from "../../utils/validation";
import LeadForm from "./LeadForm";

export default function EditLead() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [lead, setLead] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get(`/leads/${id}`);
        setLead({
          name: response.data.name || "",
          contact_number: response.data.contact_number || "",
          email: response.data.email || "",
          lead_source: response.data.lead_source || "",
          interest_level: response.data.interest_level || "",
          status: response.data.status || "new",
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load lead", "Load failed");
        navigate("/leads");
      }
    };

    load();
  }, [id, navigate, toast]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLead((current) => ({ ...current, [name]: value }));
  };

  const update = async (event) => {
    event.preventDefault();
    const validationMessage = validateLeadForm(lead);
    if (validationMessage) {
      toast.error(validationMessage, "Lead form");
      return;
    }
    setSaving(true);

    try {
      await api.put(`/leads/${id}`, {
        name: lead.name.trim(),
        contact_number: normalizePhoneNumber(lead.contact_number),
        email: normalizeEmail(lead.email),
        lead_source: lead.lead_source.trim(),
        status: lead.status,
        interest_level: lead.interest_level,
      });
      toast.success("Lead updated");
      navigate("/leads");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        (err.response?.data?.errors ? err.response.data.errors.join(", ") : null) ||
        "Update failed";
      toast.error(message, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!lead) return <p style={{ padding: 20 }}>Loading...</p>;

  return (
    <LeadForm
      title="Edit Lead"
      subtitle=""
      modeLabel="CRM Update"
      form={lead}
      onChange={handleChange}
      onSubmit={update}
      saving={saving}
      submitLabel="Save Changes"
      onCancel={() => navigate("/leads")}
      includeStatus
    />
  );
}
