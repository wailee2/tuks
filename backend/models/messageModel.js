const pool = require('../config/db');

const createMessage = async (sender_id, receiver_id, content) => {
  const query = `
    INSERT INTO messages (sender_id, receiver_id, content)
    VALUES ($1, $2, $3) RETURNING *`;
  const values = [sender_id, receiver_id, content];
  const res = await pool.query(query, values);
  return res.rows[0];
};

const getMessagesBetween = async (user1, user2) => {
  const query = `
    SELECT * FROM messages
    WHERE (sender_id = $1 AND receiver_id = $2)
       OR (sender_id = $2 AND receiver_id = $1)
    ORDER BY created_at ASC`;
  const values = [user1, user2];
  const res = await pool.query(query, values);
  return res.rows;
};

module.exports = { createMessage, getMessagesBetween };
