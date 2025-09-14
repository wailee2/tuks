// routes/notificationRoutes.js
const express = require('express');
const { listNotifications, createNotif, readNotif, readAll } = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /notifications
router.get('/', authMiddleware, listNotifications);

// POST /notifications  -- generic creation (optional protected route)
router.post('/', authMiddleware, createNotif);

// PATCH /notifications/:id/read
router.patch('/:id/read', authMiddleware, readNotif);

// POST /notifications/read-all
router.post('/read-all', authMiddleware, readAll);

module.exports = router;
