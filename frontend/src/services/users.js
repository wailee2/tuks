// services/users.js
import api from './api.js';

const authConfig = (token, extra = {}) => {
  if (token) return { headers: { Authorization: `Bearer ${token}` }, ...extra };
  return { ...extra };
};

export const getUserByUsername = async (token, username) => {
  const res = await api.get('/users/lookup', authConfig(token, { params: { username } }));
  return res.data;
};

export const getUsersByRole = async (token, role) => {
  const res = await api.get('/users', authConfig(token, { params: { role } }));
  return res.data;
};
