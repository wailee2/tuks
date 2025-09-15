// routes/userRoutes.js
const express = require('express');
const { handleSearchUsers } = require('../controllers/userController');
const { authMiddleware } = require('../middleware/authMiddleware'); // optional, allow only logged-in users to search

const router = express.Router();

// GET /api/users/search?query=...
// Optionally protect this route with authMiddleware if you want only logged-in users to search.
router.get('/search', authMiddleware, handleSearchUsers);

module.exports = router;
