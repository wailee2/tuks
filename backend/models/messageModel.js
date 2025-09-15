// models/messageModel.js
const pool = require('../config/db');

/**
 * Create a new message
 */
const createMessage = async (senderId, receiverId, content, type = 'text') => {
  const q = `
    INSERT INTO messages (sender_id, receiver_id, content, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const r = await pool.query(q, [senderId, receiverId, content, type]);
  return r.rows[0];
};

/**
 * Get messages between two users.
 * Excludes messages marked as deleted (soft-delete).
 */
const getMessagesBetweenUsers = async (userAId, userBId, limit = 50, offset = 0) => {
  const q = `
    SELECT * FROM messages
    WHERE (
      (sender_id = $1 AND receiver_id = $2)
      OR (sender_id = $2 AND receiver_id = $1)
    ) AND (is_deleted IS NOT TRUE)
    ORDER BY created_at ASC
    LIMIT $3 OFFSET $4;
  `;
  const r = await pool.query(q, [userAId, userBId, limit, offset]);
  return r.rows;
};

/**
 * Mark as delivered for all unread/undelivered messages that match
 */
const markMessagesDelivered = async (receiverId, senderId) => {
  const q = `
    UPDATE messages
    SET is_delivered = true
    WHERE receiver_id = $1 AND sender_id = $2 AND is_delivered = false
    RETURNING *;
  `;
  const r = await pool.query(q, [receiverId, senderId]);
  return r.rows;
};

/**
 * Mark as read
 */
const markMessagesRead = async (receiverId, senderId) => {
  const q = `
    UPDATE messages
    SET is_read = true
    WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false
    RETURNING *;
  `;
  const r = await pool.query(q, [receiverId, senderId]);
  return r.rows;
};

/**
 * Edit a message content. Only the sender should be allowed to call this.
 * Sets edited = true and edited_at timestamp.
 */
const editMessageById = async (messageId, senderId, newContent) => {
  const q = `
    UPDATE messages
    SET content = $1, edited = true, edited_at = NOW()
    WHERE id = $2 AND sender_id = $3 AND (is_deleted IS NOT TRUE)
    RETURNING *;
  `;
  const r = await pool.query(q, [newContent, messageId, senderId]);
  return r.rows[0];
};

/**
 * Soft-delete a message. Only the sender can delete their message.
 * If you prefer a hard delete, replace this with DELETE FROM messages WHERE id=$1 AND sender_id=$2
 */
const deleteMessageById = async (messageId, senderId) => {
  const q = `
    UPDATE messages
    SET is_deleted = true, deleted_at = NOW()
    WHERE id = $1 AND sender_id = $2 AND (is_deleted IS NOT TRUE)
    RETURNING *;
  `;
  const r = await pool.query(q, [messageId, senderId]);
  return r.rows[0];
};

module.exports = {
  createMessage,
  getMessagesBetweenUsers,
  markMessagesDelivered,
  markMessagesRead,
  editMessageById,
  deleteMessageById,
};
