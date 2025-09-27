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

// NEW: forgot password
export const forgotPassword = async (email) => {
  // returns neutral 200 response with message
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

// NEW: reset password
export const resetPassword = async (token, password) => {
  const res = await api.post('/auth/reset-password', { token, password });
  return res.data;
};

export default {
  registerUser,
  loginUser,
  checkUsername,
  startGoogleLogin,
  forgotPassword,
  resetPassword,
};