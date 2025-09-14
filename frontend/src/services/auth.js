// services/auth.js

import api from './api.js';  // existing

export const registerUser = async (name, username, email, password) => {
  const res = await api.post('/auth/register', { name, username, email, password });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};


