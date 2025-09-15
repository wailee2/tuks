// services/users.js
import api from './api.js';

export const getUserByUsername = async (token, username) => {
  const res = await api.get('/users/lookup', {
    headers: { Authorization: `Bearer ${token}` },
    params: { username }
  });
  return res.data;
};
