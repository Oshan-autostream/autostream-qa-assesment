import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { getStaff, updateStaff } from "../../api/adminUserApi";
import { getAuth } from "../../utils/auth";
import { normalizePersonName, validateUserForm } from "../../utils/validation";
import UserForm from "./UserForm";

export default function EditStaff() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { role } = getAuth();
  const isAdmin = role === "admin";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "staff",
    isDeleted: false,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getStaff();
        const found = (response.data || []).find((item) => item._id === id);

        if (!found) {
          toast.error("User not found", "Load failed");
          navigate("/admin/staff");
          return;
        }

        setUser(found);
        setForm({
          name: found.name || "",
          email: found.email || "",
          role: found.role || "staff",
          isDeleted: !!found.isDeleted,
        });
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to load user", "Load failed");
        navigate("/admin/staff");
      } finally {
        setLoading(false);
      }
    };

    if (isAdmin) load();
    else setLoading(false);
  }, [id, isAdmin, navigate, toast]);

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : name === "name" ? normalizePersonName(value) : value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const validationMessage = validateUserForm(form);
    if (validationMessage) {
      toast.error(validationMessage, "User form");
      return;
    }
    setSaving(true);
    try {
      await updateStaff(id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isDeleted: form.isDeleted,
      });
      toast.success("User updated");
      navigate("/admin/staff");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed", "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) return <div className="page" style={{ padding: "20px", textAlign: "center", color: "var(--text)" }}>Access denied</div>;
  if (loading) return <div className="page" style={{ padding: "20px", textAlign: "center", color: "var(--text)" }}>Loading...</div>;

  return (
    <UserForm
      title="Edit Staff / User"
      subtitle=""
      modeLabel="Account Update"
      form={form}
      onChange={onChange}
      onSubmit={submit}
      saving={saving}
      submitLabel="Save Changes"
      onCancel={() => navigate("/admin/staff")}
      showActiveToggle
      identity={{ name: user?.name, email: user?.email }}
    />
  );
}
