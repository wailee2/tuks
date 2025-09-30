// services/profile.js
import api from './api.js';

// GET /profile/:username
export const getProfile = async (username, token) => {
  const opts = { withCredentials: true };
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.get(`/profile/${encodeURIComponent(username)}`, opts);
  return res.data;
};

// PUT /profile
export const updateProfile = async (token, payload) => {
  const opts = { withCredentials: true };
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.put('/profile', payload, opts);
  return res.data;
};

// POST /profile/avatar
export const uploadAvatar = async (token, file) => {
  const form = new FormData();
  form.append('avatar', file);

  const opts = {
    withCredentials: true, // ensure cookies are sent
    headers: {
      // 'Content-Type' will be set automatically by axios when using FormData,
      // but keep withCredentials here.
    },
  };

  // Only add Authorization header when token is explicitly provided
  if (token) {
    opts.headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
  }

  const res = await api.post('/profile/avatar', form, opts);
  return res.data;
};

// check username
export const checkUsername = async (token, username) => {
  const opts = { withCredentials: true };
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.get(`/profile/check-username?username=${encodeURIComponent(username)}`, opts);
  return res.data;
};

export const followUser = async (username, token) => {
  const opts = {};
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.post(`/profile/${encodeURIComponent(username)}/follow`, {}, opts);
  return res.data;
};

export const unfollowUser = async (username, token) => {
  const opts = {};
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.post(`/profile/${encodeURIComponent(username)}/unfollow`, {}, opts);
  return res.data;
};

// block/unblock: username first, token optional (previously these were token-first — fixed)
export const blockUser = async (username, token) => {
  const opts = {};
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.post(`/profile/${encodeURIComponent(username)}/block`, {}, opts);
  return res.data;
};

export const unblockUser = async (username, token) => {
  const opts = {};
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.post(`/profile/${encodeURIComponent(username)}/unblock`, {}, opts);
  return res.data;
};

// request delete account — token optional (server may rely on cookies)
export const requestDelete = async (token) => {
  const opts = {};
  if (token) opts.headers = { Authorization: `Bearer ${token}` };
  const res = await api.post('/profile/request-delete', {}, opts);
  return res.data;
};