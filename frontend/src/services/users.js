// services/users.js
import api from './api.js';

export const getUserByUsername = async (token, username) => {
  const res = await api.get('/users/lookup', {
    headers: { Authorization: `Bearer ${token}` },
    params: { username }
  });
  return res.data;
};

export const getUsersByRole = async (token, role) => {
  const res = await api.get('/users', {
    headers: { Authorization: `Bearer ${token}` },
    params: { role }
  });
  return res.data;
};
