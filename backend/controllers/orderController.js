const {
  createOrder,
  addOrderItem,
  getUserOrders,
  getOrderById,
  updateOrderStatus
} = require('../models/orderModel');

// Place a new order
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body; // items = [{ productId, quantity, price }]
    if (!items || items.length === 0)
      return res.status(400).json({ message: 'Order items are required' });

    const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const order = await createOrder(userId, total);

    for (const item of items) {
      await addOrderItem(order.id, item.productId, item.quantity, item.price);
    }

    res.status(201).json({ message: 'Order placed successfully', orderId: order.id });
  } catch (err) {
    console.error('Place Order Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders of the logged-in user
const getOrders = async (req, res) => {
  try {
    const orders = await getUserOrders(req.user.id);
    res.status(200).json(orders);
  } catch (err) {
    console.error('Get Orders Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order details by ID
const getOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const orderData = await getOrderById(orderId);
    res.status(200).json(orderData);
  } catch (err) {
    console.error('Get Order Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update order status (ADMIN only)
const updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const updatedOrder = await updateOrderStatus(orderId, status);
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error('Update Order Status Error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { placeOrder, getOrders, getOrder, updateStatus };
