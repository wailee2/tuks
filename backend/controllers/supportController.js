// controllers/supportController.js
const {
  createTicket,
  getTicketById,
  getTickets,
  updateTicket,
  createComment,
  getCommentsForTicket,
  claimTicket,
  forceAssignTicket
} = require('../models/supportModel');

/**
 * Create a ticket (any authenticated user)
 * body: { subject, description, category, priority, is_public }
 */
const createSupportTicket = async (req, res) => {
  try {
    const { subject, description, category = 'general', priority = 'MEDIUM', is_public = true } = req.body;
    if (!subject || !description) return res.status(400).json({ message: 'subject and description are required' });

    const ticket = await createTicket({
      subject,
      description,
      category,
      created_by: req.user.id,
      is_public,
      priority
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error('createSupportTicket', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get tickets (support/admin) or user's own tickets.
 * Query params: mine=true => only created_by = req.user.id
 * other optional filters: status, priority, assignedTo, search, limit, offset
 */
const listTickets = async (req, res) => {
  try {
    const mine = req.query.mine === 'true';
    const filters = {
      forUserId: mine ? req.user.id : null,
      status: req.query.status || null,
      priority: req.query.priority || null,
      assignedTo: req.query.assignedTo ? parseInt(req.query.assignedTo) : null,
      search: req.query.search || null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    // If not support/admin and not requesting "mine", reject
    if (!mine && !['SUPPORT', 'ADMIN', 'OWNER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const tickets = await getTickets(filters);
    res.json(tickets);
  } catch (err) {
    console.error('listTickets', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getTicket = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const ticket = await getTicketById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    // If not public to user and not owner and not support/admin, block
    if (!ticket.is_public && ticket.created_by !== req.user.id && !['SUPPORT','ADMIN', 'OWNER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const comments = await getCommentsForTicket(id);
    res.json({ ticket, comments });
  } catch (err) {
    console.error('getTicket', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update ticket (support/admin only)
 * allowed updates: status, assigned_to, priority, subject, description, is_public
 */
// controllers/supportController.js (patchTicket - replace or update existing)
const patchTicket = async (req, res) => {
  try {
    if (!['SUPPORT', 'ADMIN', 'OWNER'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const id = parseInt(req.params.id);
    const updates = req.body;

    // Only ADMIN may change assignment via update (allowed earlier)
    if (
      Object.prototype.hasOwnProperty.call(updates, 'assigned_to') &&
      !['ADMIN', 'OWNER'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Only ADMINs n OWNER can assign tickets' });
    }

    const updated = await updateTicket(id, updates);
    if (!updated) return res.status(404).json({ message: 'Ticket not found or no valid updates' });
    res.json(updated);
  } catch (err) {
    console.error('patchTicket', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Claim a ticket (SUPPORT can claim only if unassigned; ADMIN can force-assign)
 * POST /tickets/:id/claim
 */
const claimTicketHandler = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const actor = req.user;

    if (!['SUPPORT', 'ADMIN', 'OWNER'].includes(actor.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (actor.role === 'SUPPORT') {
      // atomic claim
      const claimed = await claimTicket(id, actor.id);
      if (!claimed) {
        return res.status(409).json({ message: 'Ticket already assigned' });
      }
      // return the claimed ticket with assigned user info
      const ticket = await getTicketById(id);
      return res.json(ticket);
    }

    // ADMIN: force assign to themselves
    if (actor.role === 'ADMIN') {
      const forced = await forceAssignTicket(id, actor.id);
      if (!forced) return res.status(404).json({ message: 'Ticket not found' });
      const ticket = await getTicketById(id);
      return res.json(ticket);
    }

    // OWNER: can assign to any user
    if (actor.role === 'OWNER' && updates.assigned_to) {
      const updated = await forceAssignTicket(id, updates.assigned_to);
      if (!updated) return res.status(404).json({ message: 'Ticket not found' });
      const ticket = await getTicketById(id);
      return res.json(ticket);
    }

    res.status(400).json({ message: 'Unable to claim' });
  } catch (err) {
    console.error('claimTicketHandler', err);
    res.status(500).json({ message: 'Server error' });
  }
};


/**
 * Add a comment to a ticket
 * - user can comment on their own ticket
 * - support/admin can comment on any ticket
 * body: { message }
 */
const postComment = async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id);
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });

    const ticket = await getTicketById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    if (ticket.created_by !== req.user.id && !['SUPPORT','ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const comment = await createComment({ ticket_id: ticketId, author_id: req.user.id, message });
    res.status(201).json(comment);
  } catch (err) {
    console.error('postComment', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createSupportTicket,
  listTickets,
  getTicket,
  patchTicket,
  postComment
};


module.exports = {
  createSupportTicket,
  listTickets,
  getTicket,
  patchTicket,
  postComment,
  claimTicketHandler
};
