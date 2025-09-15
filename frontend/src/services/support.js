// services/support.js
import api from './api.js';

// create ticket
export const createTicket = async (token, payload) => {
  const res = await api.post('/support/tickets', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// get list of tickets (support/admin uses this without mine=true)
export const getTickets = async (token, params = {}) => {
  // params can include mine=true, status, priority, search, limit, offset
  const res = await api.get('/support/tickets', {
    headers: { Authorization: `Bearer ${token}` },
    params
  });
  return res.data;
};

export const getTicket = async (token, ticketId) => {
  const res = await api.get(`/support/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateTicket = async (token, ticketId, updates) => {
  const res = await api.put(`/support/tickets/${ticketId}`, updates, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const postComment = async (token, ticketId, message) => {
  const res = await api.post(`/support/tickets/${ticketId}/comments`, { message }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// services/support.js (append)
export const claimTicket = async (token, ticketId) => {
  const res = await api.post(`/support/tickets/${ticketId}/claim`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
