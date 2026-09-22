import axios from "./axios";

export const eventApi = {
  // Get all events
  getAllEvents: async () => {
    const response = await axios.get("/events");
    return response.data;
  },

  // Get single event
  getEvent: async (id) => {
    const response = await axios.get(`/events/${id}`);
    return response.data;
  },

  // Create event (admin/staff only)
  createEvent: async (eventData) => {
    const response = await axios.post("/events", eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (id, eventData) => {
    const response = await axios.put(`/events/${id}`, eventData);
    return response.data;
  },

  // Delete event
  deleteEvent: async (id) => {
    const response = await axios.delete(`/events/${id}`);
    return response.data;
  }
};

export default eventApi;
