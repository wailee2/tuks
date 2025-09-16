// services/profile.js
import api from './api.js';

export const getProfile = async (username, token) => {
  const res = await api.get(`/profile/${encodeURIComponent(username)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return res.data;
};

export async function updateProfile(token, data) {
  const res = await api.put('/profile', data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}


export const uploadAvatar = async (token, file) => {
  if (!file) throw new Error('No file provided');

  const form = new FormData();
  form.append('avatar', file);

  const res = await api.post('/profile/avatar', form, {
    headers: {
      Authorization: `Bearer ${token}`,
      // IMPORTANT: don't manually set Content-Type here. Let the browser
      // set it with the multipart boundary (axios will do that when FormData is passed).
    },
    // Extra safety: if your api axios instance sets a default content-type header
    // you can ensure it is removed for this request so the browser sets it properly:
    transformRequest: [(data, headers) => {
      // remove content-type so browser sets "multipart/form-data; boundary=----..."
      if (headers) {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }
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

