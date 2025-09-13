// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, blockUser } = require('../controllers/userController');
const { roleMiddleware } = require('../middleware/authMiddleware');

router.get('/', roleMiddleware(['owner', 'analyst']), getUsers);
router.patch('/:id', roleMiddleware(['owner']), updateUserRole);
router.patch('/:id/block', roleMiddleware(['owner', 'support']), blockUser);

module.exports = router;
