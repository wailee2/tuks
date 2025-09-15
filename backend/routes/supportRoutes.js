// routes/supportRoutes.js
const express = require('express');
const {
  createSupportTicket,
  listTickets,
  getTicket,
  patchTicket,
  postComment,
  claimTicketHandler
} = require('../controllers/supportController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { roleMiddleware } = require('../middleware/authMiddleware'); // you already have roleMiddleware

const router = express.Router();

// Create ticket (any authenticated user)
router.post('/tickets', authMiddleware, createSupportTicket);

// Get tickets:
// - ?mine=true => user's tickets (auth required)
// - otherwise only SUPPORT/ADMIN can list all
router.get('/tickets', authMiddleware, listTickets);

// Get ticket by id (auth required)
router.get('/tickets/:id', authMiddleware, getTicket);

// Update ticket (support/admin)
router.put('/tickets/:id', authMiddleware, roleMiddleware(['SUPPORT', 'ADMIN']), patchTicket);

// Comment on ticket (auth required; controller enforces ownership or support/admin)
router.post('/tickets/:id/comments', authMiddleware, postComment);

router.post('/tickets/:id/claim', authMiddleware, claimTicketHandler);

module.exports = router;
