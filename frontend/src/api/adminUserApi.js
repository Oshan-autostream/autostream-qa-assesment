import api from "./axios";

// POST /api/admin/users/create
export const createStaff = (payload) => api.post("/admin/users/create", payload);

// GET /api/admin/users
export const getStaff = () => api.get("/admin/users");

// PUT /api/admin/users/:id
export const updateStaff = (id, payload) => api.put(`/admin/users/${id}`, payload);

// DELETE /api/admin/users/:id  (soft delete -> isDeleted true)
export const deleteStaff = (id) => api.delete(`/admin/users/${id}`);