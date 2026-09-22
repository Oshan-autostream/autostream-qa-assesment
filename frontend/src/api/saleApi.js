import api from "./axios";

export const getSales = () => api.get("/sales");
export const getSalesStats = (year) => api.get(`/sales/stats?year=${year}`);

export const addSale = (data) => api.post("/sales", data); // or "/sales/add"
export const getSaleById = (id) => api.get(`/sales/${id}`);
export const updateSale = (id, data) => api.put(`/sales/${id}`, data);
export const deleteSale = (id) => api.delete(`/sales/${id}`);