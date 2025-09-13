// backend/models/notificationModel.js
const pool = require('../config/db');

async function createNotification(user_id, type, content, data = {}) {
  const res = await pool.query(
    `INSERT INTO notifications (user_id, type, content, data)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [user_id, type, content, JSON.stringify(data)]
  );
  return res.rows[0];
}

async function getUserNotifications(user_id) {
  const res = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return res.rows;
}

async function markAsRead(notification_id) {
  const res = await pool.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 RETURNING *`,
    [notification_id]
  );
  return res.rows[0];
}

module.exports = { createNotification, getUserNotifications, markAsRead };
