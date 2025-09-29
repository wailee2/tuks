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

// add this to your existing exports
export const getProductById = async (id) => {
  try {
    const res = await api.get(`/inventory/${id}`);
    return res.data;
  } catch (err) {
    // If backend returns 404, return null so UI can handle it
    if (err?.response?.status === 404) return null;
    throw err; // rethrow other errors
  }
};


// Fetch all available products for marketplace
export const fetchMarketplaceProducts = async () => {
  const res = await api.get('/inventory/marketplace'); // backend endpoint
  return res.data;
};

// Place an order
export const placeOrder = async (items) => {
  const res = await api.post('/orders', { items });
  return res.data;
};