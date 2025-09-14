const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/notificationController');

router.get('/', authMiddleware, NotificationController.getNotifications);
router.put('/:notificationId', authMiddleware, NotificationController.markAsRead);

module.exports = router;
