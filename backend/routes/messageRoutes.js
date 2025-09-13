const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendMessage, getConversation, getNotifications, markNotificationRead } = require('../controllers/messageController');

const router = express.Router();

router.use(authMiddleware);

router.post('/', sendMessage); // Send a DM
router.get('/conversation/:userId', getConversation); // Get conversation with a user
router.get('/notifications', getNotifications); // Get notifications
router.patch('/notifications/:id/read', markNotificationRead); // Mark notification as read

module.exports = router;
