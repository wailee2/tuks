import api from './api.js';

// Place a new order
export const placeOrder = async (items) => {
  const res = await api.post('/orders', { items });
  return res.data;
};

// Get orders of logged-in user
export const fetchOrders = async () => {
  const res = await api.get('/orders');
  return res.data;
};

// Get a single order by ID
export const fetchOrderById = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

// Admin: update order status
export const updateOrderStatus = async (id, status) => {
  const res = await api.put(`/orders/${id}`, { status });
  return res.data;
};
