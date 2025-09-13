const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { sendMessage, getConversation } = require('../controllers/messageController');

router.post('/', authMiddleware, sendMessage);
router.get('/conversation/:userId', authMiddleware, getConversation);

module.exports = router;
