// models/supportModel.js
const pool = require('../config/db');

/**
 * Create a new support ticket
 * payload: { subject, description, category, created_by, is_public, priority }
 */
const createTicket = async ({ subject, description, category = 'general', created_by, is_public = true, priority = 'MEDIUM' }) => {
  const q = `
    INSERT INTO support_tickets (subject, description, category, created_by, is_public, priority)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const r = await pool.query(q, [subject, description, category, created_by, is_public, priority]);
  return r.rows[0];
};

const getTicketById = async (id) => {
  const q = `SELECT st.*, u.name as created_by_name, a.name as assigned_to_name
             FROM support_tickets st
             LEFT JOIN users u ON u.id = st.created_by
             LEFT JOIN users a ON a.id = st.assigned_to
             WHERE st.id = $1`;
  const r = await pool.query(q, [id]);
  return r.rows[0];
};

/**
 * Get tickets. 
 * - if forUserId provided, only return tickets created by that user (used for "My tickets")
 * - support/admin call with no forUserId returns all tickets with optional filters
 */
const getTickets = async ({ forUserId = null, status = null, priority = null, assignedTo = null, search = null, limit = 100, offset = 0 } = {}) => {
  const filters = [];
  const params = [];
  let idx = 1;

  if (forUserId) {
    filters.push(`st.created_by = $${idx++}`);
    params.push(forUserId);
  }
  if (status) {
    filters.push(`st.status = $${idx++}`);
    params.push(status);
  }
  if (priority) {
    filters.push(`st.priority = $${idx++}`);
    params.push(priority);
  }
  if (assignedTo) {
    filters.push(`st.assigned_to = $${idx++}`);
    params.push(assignedTo);
  }
  if (search) {
    filters.push(`(st.subject ILIKE $${idx} OR st.description ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const q = `
    SELECT st.*, u.name as created_by_name, a.name as assigned_to_name
    FROM support_tickets st
    LEFT JOIN users u ON u.id = st.created_by
    LEFT JOIN users a ON a.id = st.assigned_to
    ${where}
    ORDER BY st.updated_at DESC
    LIMIT $${idx++} OFFSET $${idx++};
  `;
  params.push(limit, offset);
  const r = await pool.query(q, params);
  return r.rows;
};

const updateTicket = async (id, updates = {}) => {
  const allowed = ['status', 'assigned_to', 'priority', 'subject', 'description', 'is_public'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (keys.length === 0) return null;

  const setParts = keys.map((k, i) => `${k} = $${i + 1}`);
  const params = keys.map(k => updates[k]);
  params.push(id);

  const q = `UPDATE support_tickets SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *;`;
  const r = await pool.query(q, params);
  return r.rows[0];
};

const createComment = async ({ ticket_id, author_id, message }) => {
  const q = `
    INSERT INTO support_comments (ticket_id, author_id, message)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const r = await pool.query(q, [ticket_id, author_id, message]);
  return r.rows[0];
};

const getCommentsForTicket = async (ticket_id) => {
  const q = `
    SELECT sc.*, u.name as author_name
    FROM support_comments sc
    LEFT JOIN users u ON u.id = sc.author_id
    WHERE sc.ticket_id = $1
    ORDER BY sc.created_at ASC;
  `;
  const r = await pool.query(q, [ticket_id]);
  return r.rows;
};

module.exports = {
  createTicket,
  getTicketById,
  getTickets,
  updateTicket,
  createComment,
  getCommentsForTicket
};
