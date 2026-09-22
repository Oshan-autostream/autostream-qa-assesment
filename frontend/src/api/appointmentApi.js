import api from "./axios";

export const addAppointment = (data) => api.post("/appointments/add", data);

export const getAppointments = () => api.get("/appointments");

export const getAppointmentsByStatus = (status) => api.get(`/appointments?status=${status}`);

export const completeAppointment = (id) => api.put(`/appointments/${id}/complete`);
