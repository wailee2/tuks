// routes/messageRoutes.js
const express = require('express');
const {
  sendMessage,
  fetchMessages,
  markRead,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /messages/send  { toUsername, content, type? }
router.post('/send', authMiddleware, sendMessage);

// GET /messages/:username?limit=50&page=0
router.get('/:username', authMiddleware, fetchMessages);

// POST /messages/:username/read  (mark messages from username as read)
router.post('/:username/read', authMiddleware, markRead);

// PUT /messages/:id  (edit message)   -> body: { content }
router.put('/:id', authMiddleware, editMessage);

// DELETE /messages/:id  (delete message)
router.delete('/:id', authMiddleware, deleteMessage);

module.exports = router;
