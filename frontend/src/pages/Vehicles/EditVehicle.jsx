import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildAssetUrl } from "../../api/axios";
import { useToast } from "../../components/ToastProvider";
import { deleteVehicleImage, getVehicleById, updateVehicle } from "../../api/vehicleApi";
import { validateVehicleForm, validateVehicleImages } from "../../utils/validation";
import VehicleForm from "./VehicleForm";

function toImgSrc(url) {
  return buildAssetUrl(url);
}

export default function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [vehicle, setVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newImages, setNewImages] = useState([]);

  const previews = useMemo(() => newImages.map((file) => URL.createObjectURL(file)), [newImages]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  useEffect(() => {
    getVehicleById(id)
      .then((response) => setVehicle(response.data))
      .catch((err) => {
        toast.error(err.response?.data?.message || "Vehicle not found", "Load failed");
        navigate("/vehicles");
      });
  }, [id, navigate, toast]);

  if (!vehicle) return <p style={{ padding: 20 }}>Loading...</p>;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setVehicle((current) => ({ ...current, [name]: value }));
  };

  const existingImages = (vehicle.images || []).map((image) => ({
    ...image,
    url: toImgSrc(image.url),
  }));

  const onPickImages = (event) => {
    const files = Array.from(event.target.files || []);
    const validationMessage = validateVehicleImages(files, existingImages.length + newImages.length);
    if (validationMessage) {
      toast.error(validationMessage, "Upload blocked");
      event.target.value = "";
      return;
    }
    const remainingSlots = Math.max(0, 4 - existingImages.length - newImages.length);
    setNewImages((current) => [...current, ...files.slice(0, remainingSlots)]);
    event.target.value = "";
  };

  const removePickedImage = (index) => {
    setNewImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const removeExistingImage = async (filename) => {
    if (!window.confirm("Delete this photo?")) return;
    try {
      const response = await deleteVehicleImage(vehicle._id, filename);
      setVehicle(response.data.vehicle || response.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed", "Photo removal failed");
    }
  };

  const submit = async (event) => {
    event.preventDefault();

    const validationMessage = validateVehicleForm(vehicle);
    if (validationMessage) {
      toast.error(validationMessage, "Vehicle form");
      return;
    }

    const yearNumber = Number(vehicle.year);
    const priceNumber = Number(vehicle.price);
    const mileageNumber = vehicle.mileage === "" || vehicle.mileage === null ? null : Number(vehicle.mileage);

    const formData = new FormData();
    formData.append("brand", vehicle.brand.trim());
    formData.append("model", (vehicle.model || "").trim());
    formData.append("type", vehicle.type);
    formData.append("condition", vehicle.condition || "");
    formData.append("fuelType", vehicle.fuelType || "");
    formData.append("transmission", vehicle.transmission || "");
    formData.append("year", String(yearNumber));
    formData.append("mileage", mileageNumber === null ? "" : String(mileageNumber));
    formData.append("price", String(priceNumber));
    formData.append("status", vehicle.status || "available");
    formData.append("vehicleNumber", (vehicle.vehicleNumber || "").trim());
    formData.append("details", (vehicle.details || "").trim());
    newImages.forEach((file) => formData.append("images", file));

    try {
      setSaving(true);
      const response = await updateVehicle(id, formData);
      setVehicle(response.data);
      setNewImages([]);
      toast.success("Vehicle updated");
      navigate("/vehicles");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed", "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VehicleForm
      title="Edit Vehicle"
      subtitle=""
      modeLabel="Inventory Update"
      vehicle={{
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        type: vehicle.type || "",
        condition: vehicle.condition || "",
        fuelType: vehicle.fuelType || "",
        transmission: vehicle.transmission || "",
        year: vehicle.year ?? "",
        mileage: vehicle.mileage ?? "",
        price: vehicle.price ?? "",
        status: vehicle.status || "available",
        vehicleNumber: vehicle.vehicleNumber || "",
        details: vehicle.details || "",
      }}
      onChange={handleChange}
      onSubmit={submit}
      saving={saving}
      submitLabel="Save Changes"
      onCancel={() => navigate("/vehicles")}
      previews={previews}
      onPickImages={onPickImages}
      removeImage={removePickedImage}
      existingImages={existingImages}
      removeExistingImage={removeExistingImage}
    />
  );
}
