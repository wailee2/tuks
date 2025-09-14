// models/notificationModel.js
const pool = require('../config/db');

const createNotification = async (userId, actorId, type, title, body, url = null) => {
  const q = `
    INSERT INTO notifications (user_id, actor_id, type, title, body, url)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const r = await pool.query(q, [userId, actorId, type, title, body, url]);
  return r.rows[0];
};

const getNotificationsForUser = async (userId, limit = 50, offset = 0) => {
  const q = `
    SELECT * FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const r = await pool.query(q, [userId, limit, offset]);
  return r.rows;
};

const markNotificationRead = async (notificationId, userId) => {
  const q = `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1 AND user_id = $2
    RETURNING *;
  `;
  const r = await pool.query(q, [notificationId, userId]);
  return r.rows[0];
};

const markAllNotificationsRead = async (userId) => {
  const q = `
    UPDATE notifications
    SET is_read = true
    WHERE user_id = $1 AND is_read = false
    RETURNING *;
  `;
  const r = await pool.query(q, [userId]);
  return r.rows;
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
};
