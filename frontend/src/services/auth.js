// services/auth.js

import api from './api.js'; 

export const registerUser = async (name, username, email, password) => {
  const res = await api.post('/auth/register', { name, username, email, password });
  return res.data;
};

export const loginUser = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};


export const checkUsername = async (username) => {
  const res = await api.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
  return res.data;
};

export const startGoogleLogin = () => {
  // prefer explicit env so proxy works
  const base = import.meta.env.VITE_API_URL || '';
  const url = `${base.replace(/\/$/, '')}/auth/google`; // produces "/api/auth/google" in dev
  window.location.href = url;
};
