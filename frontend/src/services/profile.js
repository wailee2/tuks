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

export const followUser = async (token, username) => {
  const res = await api.post(`/profile/${encodeURIComponent(username)}/follow`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const unfollowUser = async (token, username) => {
  const res = await api.post(`/profile/${encodeURIComponent(username)}/unfollow`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const blockUser = async (token, username) => {
  const res = await api.post(`/profile/${encodeURIComponent(username)}/block`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const unblockUser = async (token, username) => {
  const res = await api.post(`/profile/${encodeURIComponent(username)}/unblock`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const requestDelete = async (token) => {
  const res = await api.post('/profile/request-delete', {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

