const pool = require('../config/db');

const createMessage = async (sender_id, receiver_id, content) => {
  const res = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, content) 
     VALUES ($1, $2, $3) RETURNING *`,
    [sender_id, receiver_id, content]
  );
  return res.rows[0];
};

const getMessagesBetweenUsers = async (user1, user2) => {
  const res = await pool.query(
    `SELECT * FROM messages 
     WHERE (sender_id = $1 AND receiver_id = $2) 
        OR (sender_id = $2 AND receiver_id = $1)
     ORDER BY created_at ASC`,
    [user1, user2]
  );
  return res.rows;
};

module.exports = { createMessage, getMessagesBetweenUsers };
