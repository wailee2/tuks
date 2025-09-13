const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const {
  placeOrder,
  getOrders,
  getOrder,
  updateStatus
} = require('../controllers/orderController');

// Authenticated routes
router.post('/', authMiddleware, placeOrder);
router.get('/', authMiddleware, getOrders);
router.get('/:id', authMiddleware, getOrder);

// Admin only route
router.put('/:id', authMiddleware, roleMiddleware(['ADMIN']), updateStatus);

module.exports = router;
