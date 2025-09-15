// routes/adminRoutes.js
const express = require('express');
const { getAllUsers, updateUserRole, disableUser } = require('../controllers/adminController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// ADMIN and MODERATOR can view users
router.get('/users', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), getAllUsers);

// Update user role (ADMIN only)
router.put('/users/role', authMiddleware, roleMiddleware(['ADMIN']), updateUserRole);

// Disable / enable user (ADMIN + MODERATOR) - moderator cannot disable an ADMIN (enforced in controller)
router.put('/users/disable', authMiddleware, roleMiddleware(['ADMIN', 'MODERATOR']), disableUser);

module.exports = router;
