const MessageModel = require('../models/messageModel');
const NotificationModel = require('../models/notificationModel');

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    const message = await MessageModel.createMessage({ senderId, receiverId, content });

    // create notification
    await NotificationModel.createNotification({
      userId: receiverId,
      type: 'message',
      message: `New message from ${req.user.name}`,
    });

    // emit real-time event
    req.io.to(`user_${receiverId}`).emit('receive_message', message);

    return res.json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.id;
    const messages = await MessageModel.getConversation(userId, otherUserId);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const updated = await MessageModel.updateMessage(messageId, content);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    await MessageModel.deleteMessage(messageId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

// helper for sockets
exports.sendMessageSocket = async (io, msg) => {
  const { senderId, receiverId, content } = msg;
  const message = await MessageModel.createMessage({ senderId, receiverId, content });

  io.to(`user_${receiverId}`).emit('receive_message', message);
  io.to(`user_${senderId}`).emit('message_sent', message);
};
