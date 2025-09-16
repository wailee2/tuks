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


export const uploadAvatar = async (token, fileOrFormData) => {
  let form;
  if (fileOrFormData instanceof FormData) {
    form = fileOrFormData;
  } else {
    form = new FormData();
    form.append('avatar', fileOrFormData);
  }

  // debug: inspect entries (safe to remove later)
  for (const pair of form.entries()) {
    console.log('uploadAvatar formdata:', pair[0], pair[1]);
  }

  const res = await api.post('/profile/avatar', form, {
    headers: { Authorization: `Bearer ${token}` },
    transformRequest: [(data, headers) => {
      // ensure no pre-set Content-Type (so browser sets boundary)
      if (headers && headers['Content-Type']) delete headers['Content-Type'];
      return data;
    }]
  });

  return res.data;
};


export const checkUsername = async (token, username) => {
  const res = await api.get('/profile/check-username', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
