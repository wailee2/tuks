const express = require('express');
const { getAllUsers } = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Only ADMIN can access this route
router.get('/users', authMiddleware, roleMiddleware(['ADMIN']), getAllUsers);

module.exports = router;
