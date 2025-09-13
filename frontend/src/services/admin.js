import api from './api.js';

// Get all users
export const getAllUsers = async (token) => {
  const res = await api.get('/admin/users', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// Update user role (promote/demote)
export const updateUserRole = async (token, userId, role) => {
  const res = await api.put('/admin/users/role', 
    { userId, role },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};
