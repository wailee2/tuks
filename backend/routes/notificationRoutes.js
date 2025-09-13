const express = require('express');
const { getNotifications, markNotificationRead } = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authMiddleware);

router.get('/', getNotifications);
router.patch('/:id/read', markNotificationRead);

module.exports = router;
