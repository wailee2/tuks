const pool = require('../config/db');

const MessageModel = {
  async createMessage({ senderId, receiverId, content }) {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [senderId, receiverId, content]
    );
    return result.rows[0];
  },

  async getConversation(userId, otherUserId) {
    const result = await pool.query(
      `SELECT m.*, 
              u1.name as sender_name, 
              u2.name as receiver_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
          OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [userId, otherUserId]
    );
    return result.rows;
  },

  async updateMessage(messageId, content) {
    const result = await pool.query(
      `UPDATE messages 
       SET content = $1, edited = true, updated_at = NOW() 
       WHERE id = $2 
       RETURNING *`,
      [content, messageId]
    );
    return result.rows[0];
  },

  async deleteMessage(messageId) {
    await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId]);
    return { success: true };
  },
};

module.exports = MessageModel;
