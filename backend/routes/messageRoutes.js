const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const MessageController = require('../controllers/messageController');

router.post('/', authMiddleware, MessageController.sendMessage);
router.get('/:otherUserId', authMiddleware, MessageController.getConversation);
router.put('/:messageId', authMiddleware, MessageController.updateMessage);
router.delete('/:messageId', authMiddleware, MessageController.deleteMessage);

module.exports = router;
