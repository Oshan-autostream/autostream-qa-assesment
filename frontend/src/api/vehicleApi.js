import api from "./axios";

export const addVehicle = (formData) =>
  api.post("/vehicles", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateVehicle = (id, formData) =>
  api.put(`/vehicles/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteVehicleImage = (vehicleId, filename) =>
  api.delete(`/vehicles/${vehicleId}/images/${encodeURIComponent(filename)}`);

export const getVehicles = (params = {}) => api.get("/vehicles", { params });
export const getVehicleById = (id) => api.get(`/vehicles/${id}`);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);
