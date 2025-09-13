const pool = require('../config/db');

// Create a new order
const createOrder = async (userId, total) => {
  const result = await pool.query(
    'INSERT INTO orders (user_id, total) VALUES ($1, $2) RETURNING *',
    [userId, total]
  );
  return result.rows[0];
};

// Add item to order
const addOrderItem = async (orderId, productId, quantity, price) => {
  const result = await pool.query(
    'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4) RETURNING *',
    [orderId, productId, quantity, price]
  );
  return result.rows[0];
};

// Get all orders of a user
const getUserOrders = async (userId) => {
  const result = await pool.query(
    'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
};

// Get order by ID with items
const getOrderById = async (orderId) => {
  const orderResult = await pool.query('SELECT * FROM orders WHERE id=$1', [orderId]);
  const itemsResult = await pool.query(
    'SELECT oi.id, oi.quantity, oi.price, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE order_id=$1',
    [orderId]
  );
  return { order: orderResult.rows[0], items: itemsResult.rows };
};

// Update order status
const updateOrderStatus = async (orderId, status) => {
  const result = await pool.query(
    'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
    [status, orderId]
  );
  return result.rows[0];
};

module.exports = {
  createOrder,
  addOrderItem,
  getUserOrders,
  getOrderById,
  updateOrderStatus
};
