// routes/userRoutes.js
const express = require('express');
const { handleSearchUsers, lookupUserByUsername, getUsersByRole } = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware'); // optional, allow only logged-in users to search

const router = express.Router();



// Search users (admins/support only)
// routes/userRoutes.js
router.get(
  '/',
  authMiddleware,
  roleMiddleware(['SUPPORT', 'ADMIN']),
  getUsersByRole
);

router.get(
  '/search',
  authMiddleware,
  handleSearchUsers
);

// Lookup user by username
router.get(
  '/lookup',
  authMiddleware,
  roleMiddleware(['SUPPORT', 'ADMIN']),
  lookupUserByUsername
);

module.exports = router;
