const express = require('express');
const { getAllUsers, updateUserRole } = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Only ADMIN can access
router.get('/users', authMiddleware, roleMiddleware(['ADMIN']), getAllUsers);

// Update user role
router.put('/users/role', authMiddleware, roleMiddleware(['ADMIN']), updateUserRole);

module.exports = router;
