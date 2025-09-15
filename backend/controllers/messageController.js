// controllers/messageController.js
const {
  createMessage,
  getMessagesBetweenUsers,
  markMessagesDelivered,
  markMessagesRead,
  editMessageById,
  deleteMessageById,
} = require('../models/messageModel');
const { createNotification } = require('../models/notificationModel'); // keep if you have one
const { getUserByUsername } = require('../models/userModel');

/* ---------- sendMessage (same as your existing implementation) ---------- */
const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id; // authMiddleware populates req.user
    const { toUsername, content, type } = req.body;
    if (!toUsername || !content) return res.status(400).json({ message: 'toUsername and content required' });

    const receiver = await getUserByUsername(toUsername);
    if (!receiver) return res.status(404).json({ message: 'Recipient not found' });

    const message = await createMessage(senderId, receiver.id, content, type || 'text');

    // create notification (optional)
    let notif = null;
    try {
      if (createNotification) {
        notif = await createNotification(
          receiver.id,
          senderId,
          'message',
          `New message from ${req.user.id === senderId ? req.user.id : ''}`,
          content.length > 200 ? content.slice(0, 197) + '...' : content,
          `/chat/${toUsername}`
        );
      }
    } catch (e) {
      console.warn('createNotification failed', e);
    }

    // socket emit if available
    try {
      const io = req.app?.get('io');
      if (io) {
        io.to(`user_${receiver.id}`).emit('private_message', message);
        io.to(`user_${senderId}`).emit('private_message', message);
        if (notif) io.to(`user_${receiver.id}`).emit('notification', notif);
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

/* ---------- fetchMessages ---------- */
const fetchMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const otherUsername = req.params.username;
    const limit = Math.min(200, parseInt(req.query.limit || '50', 10));
    const page = Math.max(0, parseInt(req.query.page || '0', 10));
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

/* ---------- markRead ---------- */
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

/* ---------- editMessage (PUT /api/messages/:id) ---------- */
const editMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;
    const { content } = req.body;
    if (!content || content.trim().length === 0) return res.status(400).json({ message: 'content required' });

    const updated = await editMessageById(messageId, userId, content.trim());

    if (!updated) {
      // either message not found, already deleted, or user not sender
      return res.status(404).json({ message: 'Message not found or you are not allowed to edit it' });
    }

    // notify via socket about message update
    try {
      const io = req.app?.get('io');
      if (io) {
        // emit an update event so clients can update the message in-place
        io.to(`user_${updated.receiver_id}`).emit('message_updated', updated);
        io.to(`user_${updated.sender_id}`).emit('message_updated', updated);
      }
    } catch (err) {
      console.warn('socket emit message_updated failed', err);
    }

    res.json({ message: updated });
  } catch (err) {
    console.error('editMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------- deleteMessage (DELETE /api/messages/:id) ---------- */
const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.id;

    const deleted = await deleteMessageById(messageId, userId);

    if (!deleted) {
      return res.status(404).json({ message: 'Message not found or you are not allowed to delete it' });
    }

    // notify via socket about message deletion (clients can hide it)
    try {
      const io = req.app?.get('io');
      if (io) {
        io.to(`user_${deleted.receiver_id}`).emit('message_deleted', { id: deleted.id });
        io.to(`user_${deleted.sender_id}`).emit('message_deleted', { id: deleted.id });
      }
    } catch (err) {
      console.warn('socket emit message_deleted failed', err);
    }

    res.json({ message: 'deleted', id: deleted.id });
  } catch (err) {
    console.error('deleteMessage error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  sendMessage,
  fetchMessages,
  markRead,
  editMessage,
  deleteMessage,
};
