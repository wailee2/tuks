// backend/controllers/messageController.js
const pool = require('../config/db');
const Notification = require('../models/notificationModel');

// Express handler: send message via REST (req.io optionally used to emit)
const sendMessage = async (req, res) => {
  const { receiver_id, content } = req.body;
  const sender_id = req.user.id;

  if (!receiver_id || !content) {
    return res.status(400).json({ message: 'Receiver and content required' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );
    const message = result.rows[0];

    // Create notification record
    try {
      await Notification.createNotification(
        receiver_id,
        'message',
        `New message from user ${sender_id}`,
        { sender_id }
      );
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // Emit real-time event if io is attached to request (see server.js middleware attaching io)
    try {
      if (req.io) {
        req.io.to(`user_${receiver_id}`).emit('receive_message', message);
        req.io.to(`user_${receiver_id}`).emit('new_notification', {
          type: 'message',
          content: `New message from user ${sender_id}`,
          data: { sender_id }
        });
      }
    } catch (emitErr) {
      console.error('Emit error:', emitErr);
    }

    res.json(message);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
};

// Fetch conversation between current user and other user
const getConversation = async (req, res) => {
  const otherUserId = parseInt(req.params.userId);
  const currentUserId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = $1 AND receiver_id = $2)
          OR (sender_id = $2 AND receiver_id = $1)
       ORDER BY created_at ASC`,
      [currentUserId, otherUserId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ message: 'Failed to get messages' });
  }
};

// Helper for socket usage: persist message and emit via io
const sendMessageSocket = async (io, msg) => {
  // msg should be { sender_id, receiver_id, content }
  try {
    const { sender_id, receiver_id, content } = msg;
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES ($1, $2, $3) RETURNING *',
      [sender_id, receiver_id, content]
    );
    const message = result.rows[0];

    // create notification record
    try {
      await Notification.createNotification(
        receiver_id,
        'message',
        `New message from user ${sender_id}`,
        { sender_id }
      );
    } catch (notifErr) {
      console.error('Failed to create notification:', notifErr);
    }

    // emit to both rooms (sender and receiver)
    io.to(`user_${receiver_id}`).emit('receive_message', message);
    io.to(`user_${sender_id}`).emit('receive_message', message);

    // also emit notification event
    io.to(`user_${receiver_id}`).emit('new_notification', {
      type: 'message',
      content: `New message from user ${sender_id}`,
      data: { sender_id }
    });

    return message;
  } catch (err) {
    console.error('sendMessageSocket error:', err);
    throw err;
  }
};

module.exports = { sendMessage, getConversation, sendMessageSocket };
