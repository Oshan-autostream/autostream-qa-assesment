import api from "./axios";

export const addLead = (data) => {
  return api.post("/leads/add", data);
};

export const getLeads = () => {
  return api.get("/leads");
};
