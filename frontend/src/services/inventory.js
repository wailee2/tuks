import api from './api';

export const addProduct = async (data) => {
  const res = await api.post('/inventory', data);
  return res.data;
};

export const getUserInventory = async () => {
  const res = await api.get('/inventory/user');
  return res.data;
};

export const updateProduct = async (id, data) => {
  const res = await api.put(`/inventory/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  const res = await api.delete(`/inventory/${id}`);
  return res.data;
};

// Fetch all available products for marketplace
export const fetchMarketplaceProducts = async () => {
  const res = await api.get('/inventory/marketplace'); // backend endpoint
  return res.data;
};