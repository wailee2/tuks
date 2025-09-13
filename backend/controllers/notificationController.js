const pool = require('../config/db');

// Get notifications for user
const getNotifications = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET is_read=TRUE WHERE id=$1', [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getNotifications, markNotificationRead };
