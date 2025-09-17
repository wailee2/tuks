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



export async function uploadAvatar(token, file) {
  const fd = new FormData();
  fd.append('avatar', file); // matches upload.single('avatar') on the server

  try {
    const res = await api.post('/profile/avatar', fd, {
      headers: {
        Authorization: `Bearer ${token}`,
        // do NOT set Content-Type manually — axios will set the boundary
      },
    });
    return res.data;
  } catch (err) {
    // helpful debug info
    console.error('uploadAvatar error', err.response?.status, err.response?.data);
    throw err;
  }
}



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

