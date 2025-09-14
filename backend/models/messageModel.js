// models/messageModel.js
const pool = require('../config/db');

const createMessage = async (senderId, receiverId, content, type = 'text') => {
  const q = `
    INSERT INTO messages (sender_id, receiver_id, content, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const r = await pool.query(q, [senderId, receiverId, content, type]);
  return r.rows[0];
};

const getMessagesBetweenUsers = async (userAId, userBId, limit = 50, offset = 0) => {
  const q = `
    SELECT * FROM messages
    WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
    ORDER BY created_at ASC
    LIMIT $3 OFFSET $4;
  `;
  const r = await pool.query(q, [userAId, userBId, limit, offset]);
  return r.rows;
};

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

module.exports = {
  createMessage,
  getMessagesBetweenUsers,
  markMessagesDelivered,
  markMessagesRead,
};
