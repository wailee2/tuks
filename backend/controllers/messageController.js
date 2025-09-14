// controllers/messagesController.js
const { createMessage, getMessagesBetweenUsers, markMessagesDelivered, markMessagesRead } = require('../models/messageModel');
const { createNotification } = require('../models/notificationModel');
const { getUserByUsername } = require('../models/userModel');

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; // authMiddleware populates req.user
    const { toUsername, content, type } = req.body;
    if (!toUsername || !content) return res.status(400).json({ message: 'toUsername and content required' });

    const receiver = await getUserByUsername(toUsername);
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    // create message
    const message = await createMessage(senderId, receiver.id, content, type || 'text');

    // try to create a notification for the receiver
    const notif = await createNotification(
      receiver.id,
      senderId,
      'message',
      `New message from ${req.user.id === senderId ? req.user.id : ''}`, // optional title
      content.length > 200 ? content.slice(0, 197) + '...' : content,
      `/chat/${toUsername}`
    );

    // emit via socket.io if available on app (server should do app.set('io', io))
    try {
      const io = req.app?.get('io');
      if (io) {
        // emit message to receiver room and sender room (so both clients update)
        io.to(`user_${receiver.id}`).emit('private_message', message);
        io.to(`user_${senderId}`).emit('private_message', message);

        // emit notification
        io.to(`user_${receiver.id}`).emit('notification', notif);
      }
    } catch (err) {
      console.error('Socket emit failed', err);
    }

    return res.status(201).json({ message, notification: notif });
  } catch (err) {
    console.error('sendMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const fetchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUsername = req.params.username;
    const limit = Math.min(200, parseInt(req.query.limit || '50'));
    const page = Math.max(0, parseInt(req.query.page || '0'));
    const offset = page * limit;

    const other = await getUserByUsername(otherUsername);
    if (!other) return res.status(404).json({ message: 'User not found' });

    const messages = await getMessagesBetweenUsers(userId, other.id, limit, offset);

    // mark delivered for messages where current user is receiver
    await markMessagesDelivered(userId, other.id);

    res.json({ messages });
  } catch (err) {
    console.error('fetchMessages error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUsername = req.params.username;
    const other = await getUserByUsername(otherUsername);
    if (!other) return res.status(404).json({ message: 'User not found' });

    const updated = await markMessagesRead(userId, other.id);

    // optional socket notify sender that messages are read
    try {
      const io = req.app?.get('io');
      if (io) {
        io.to(`user_${other.id}`).emit('messages_read', { by: userId, from: other.id });
      }
    } catch (err) {
      console.error('socket notify read failed', err);
    }

    res.json({ updatedCount: updated.length });
  } catch (err) {
    console.error('markRead error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { sendMessage, fetchMessages, markRead };
