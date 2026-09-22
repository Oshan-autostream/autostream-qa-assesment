import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { addLead } from "../../api/leadApi";
import { normalizeEmail, normalizePhoneNumber, validateLeadForm } from "../../utils/validation";
import LeadForm from "./LeadForm";

function AddLead() {
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_number: "",
    email: "",
    lead_source: "",
    interest_level: "",
    status: "new",
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateLeadForm(formData);
    if (validationMessage) {
      toast.error(validationMessage, "Lead form");
      return;
    }
    setSaving(true);

    try {
      await addLead({
        name: formData.name.trim(),
        contact_number: normalizePhoneNumber(formData.contact_number),
        email: normalizeEmail(formData.email),
        lead_source: formData.lead_source.trim(),
        interest_level: formData.interest_level,
      });
      toast.success("Lead added successfully");
      navigate("/leads");
    } catch (err) {
      const message = err.response?.data?.message || err.response?.data?.errors?.[0] || err.message || "Error adding lead";
      toast.error(message, "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <LeadForm
      title="Add Lead"
      subtitle=""
      modeLabel="New CRM Entry"
      form={formData}
      onChange={handleChange}
      onSubmit={submit}
      saving={saving}
      submitLabel="Save Lead"
      onCancel={() => navigate("/leads")}
    />
  );
}

export default AddLead;
