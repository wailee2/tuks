// src/services/admin.js
import api from './api';

const buildOptionsWithToken = (token) => {
  if (!token) return {}; // do NOT send Authorization header if token is falsy
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getAllUsers = async (token) => {
  const options = buildOptionsWithToken(token);
  const res = await api.get('/admin/users', options);
  return res.data;
};

export const updateUserRole = async (token, userId, role) => {
  const options = buildOptionsWithToken(token);
  const res = await api.put('/admin/users/role', { userId, role }, options);
  return res.data;
};

export const disableUser = async (token, userId, disable) => {
  const options = buildOptionsWithToken(token);
  const res = await api.put('/admin/users/disable', { userId, disable }, options);
  return res.data;
};
