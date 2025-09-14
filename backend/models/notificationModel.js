const pool = require('../config/db');

const NotificationModel = {
  async createNotification({ userId, type, message }) {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, type, message]
    );
    return result.rows[0];
  },

  async getNotifications(userId) {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  async markAsRead(notificationId) {
    await pool.query(
      `UPDATE notifications SET read = true WHERE id = $1`,
      [notificationId]
    );
    return { success: true };
  },
};

module.exports = NotificationModel;
