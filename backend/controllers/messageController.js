const pool = require('../config/db');

// Send message
const sendMessage = async (req, res) => {
  try {
    const { receiver_id, content } = req.body;
    const sender_id = req.user.id;

    if (!receiver_id || !content) return res.status(400).json({ message: 'All fields are required' });

    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );

    // Optional: create notification for receiver
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [receiver_id, `New message from user ${sender_id}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get conversation between two users
const getConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUserId = req.params.userId;

    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id=$1 AND receiver_id=$2) OR (sender_id=$2 AND receiver_id=$1)
       ORDER BY created_at ASC`,
      [userId, otherUserId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user's notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE notifications SET read=TRUE WHERE id=$1', [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendMessage, getConversation, getNotifications, markNotificationRead };
