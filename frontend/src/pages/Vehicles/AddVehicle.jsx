import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addVehicle } from "../../api/vehicleApi";
import { useToast } from "../../components/ToastProvider";
import { validateVehicleForm, validateVehicleImages } from "../../utils/validation";
import VehicleForm from "./VehicleForm";

export default function AddVehicle() {
  const navigate = useNavigate();
  const toast = useToast();
  const [vehicle, setVehicle] = useState({
    brand: "",
    model: "",
    type: "",
    condition: "",
    fuelType: "",
    transmission: "",
    year: "",
    mileage: "",
    price: "",
    status: "available",
    vehicleNumber: "",
    details: "",
  });
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const previews = useMemo(() => images.map((file) => URL.createObjectURL(file)), [images]);

  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setVehicle((current) => ({ ...current, [name]: value }));
  };

  const onPickImages = (event) => {
    const files = Array.from(event.target.files || []);
    const validationMessage = validateVehicleImages(files, images.length);
    if (validationMessage) {
      toast.error(validationMessage, "Upload blocked");
      event.target.value = "";
      return;
    }
    const remainingSlots = Math.max(0, 4 - images.length);
    setImages((current) => [...current, ...files.slice(0, remainingSlots)]);
    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
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
    const mileageNumber = vehicle.mileage === "" ? null : Number(vehicle.mileage);

    const formData = new FormData();
    formData.append("brand", vehicle.brand.trim());
    formData.append("model", (vehicle.model || "").trim());
    formData.append("type", vehicle.type);
    formData.append("condition", vehicle.condition || "");
    formData.append("fuelType", vehicle.fuelType);
    formData.append("transmission", vehicle.transmission);
    formData.append("year", String(yearNumber));
    formData.append("mileage", mileageNumber === null ? "" : String(mileageNumber));
    formData.append("price", String(priceNumber));
    formData.append("status", vehicle.status);
    formData.append("vehicleNumber", vehicle.vehicleNumber.trim());
    formData.append("details", vehicle.details.trim());
    images.forEach((file) => formData.append("images", file));

    try {
      setSaving(true);
      await addVehicle(formData);
      toast.success("Vehicle added successfully");
      navigate("/vehicles");
    } catch (err) {
      toast.error(err.response?.data?.message || "Error adding vehicle", "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <VehicleForm
      title="Add Vehicle"
      subtitle=""
      modeLabel="New Inventory Entry"
      vehicle={vehicle}
      onChange={handleChange}
      onSubmit={submit}
      saving={saving}
      submitLabel="Save Vehicle"
      onCancel={() => navigate("/vehicles")}
      previews={previews}
      onPickImages={onPickImages}
      removeImage={removeImage}
      existingImages={[]}
      removeExistingImage={() => {}}
    />
  );
}
