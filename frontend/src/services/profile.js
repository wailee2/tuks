// services/profile.js
import api from './api.js';

export const getProfile = async (username, token) => {
  const res = await api.get(`/profile/${encodeURIComponent(username)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export const updateProfile = async (token, payload) => {
  const res = await api.put('/profile', payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const uploadAvatar = async (token, file) => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await api.post('/profile/avatar', form, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const checkUsername = async (token, username) => {
  const res = await api.get('/profile/check-username', {
    headers: { Authorization: `Bearer ${token}` },
    params: { username }
  });
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
