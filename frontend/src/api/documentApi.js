import api from "./axios";

export const getDocs = () => api.get("/documents");
export const getDocById = (id) => api.get(`/documents/${id}`);

export const addDoc = (data) => api.post("/documents", data);
export const updateDoc = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDoc = (id) => api.delete(`/documents/${id}`);