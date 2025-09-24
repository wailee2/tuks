// services/support.js
import api from './api.js';

const authConfig = (token, extra = {}) => {
  // only include Authorization when token is truthy
  if (token) return { headers: { Authorization: `Bearer ${token}` }, ...extra };
  return { ...extra }; // rely on api withCredentials cookie session
};

// create ticket
export const createTicket = async (token, payload) => {
  const res = await api.post('/support/tickets', payload, authConfig(token));
  return res.data;
};

// get list of tickets (support/admin uses this without mine=true)
export const getTickets = async (token, params = {}) => {
  const config = authConfig(token, { params });
  const res = await api.get('/support/tickets', config);
  return res.data;
};

export const getTicket = async (token, ticketId) => {
  const res = await api.get(`/support/tickets/${ticketId}`, authConfig(token));
  return res.data;
};

export const updateTicket = async (token, ticketId, updates) => {
  const res = await api.put(`/support/tickets/${ticketId}`, updates, authConfig(token));
  return res.data;
};

export const postComment = async (token, ticketId, message) => {
  const res = await api.post(`/support/tickets/${ticketId}/comments`, { message }, authConfig(token));
  return res.data;
};

export const claimTicket = async (token, ticketId) => {
  const res = await api.post(`/support/tickets/${ticketId}/claim`, {}, authConfig(token));
  return res.data;
};
