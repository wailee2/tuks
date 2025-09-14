// controllers/notificationController.js
const {
  createNotification,
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
} = require('../models/notificationModel');

const listNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(200, parseInt(req.query.limit || '50'));
    const page = Math.max(0, parseInt(req.query.page || '0'));
    const offset = page * limit;
    const items = await getNotificationsForUser(userId, limit, offset);
    res.json({ notifications: items });
  } catch (err) {
    console.error('listNotifications', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createNotif = async (req, res) => {
  try {
    // this is a generic endpoint (you may restrict usage)
    const userId = req.body.userId;
    const actorId = req.user?.id || null;
    const { type, title, body, url } = req.body;
    if (!userId || !type) return res.status(400).json({ message: 'userId and type required' });

    const n = await createNotification(userId, actorId, type, title || '', body || '', url || null);

    // emit via socket if present
    try {
      const io = req.app?.get('io');
      if (io) io.to(`user_${userId}`).emit('notification', n);
    } catch (err) { console.error('notif emit err', err); }

    res.status(201).json({ notification: n });
  } catch (err) {
    console.error('createNotif', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const readNotif = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;
    const n = await markNotificationRead(notifId, userId);
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    res.json({ notification: n });
  } catch (err) {
    console.error('readNotif', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const readAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const updated = await markAllNotificationsRead(userId);
    res.json({ updatedCount: updated.length });
  } catch (err) {
    console.error('readAll', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { listNotifications, createNotif, readNotif, readAll };
