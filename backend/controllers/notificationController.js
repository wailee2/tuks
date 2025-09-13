// backend/controllers/notificationController.js
const Notification = require('../models/notificationModel');

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.getUserNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Notification.markAsRead(id);
    res.json(updated);
  } catch (err) {
    console.error('Mark notification read error:', err);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

module.exports = { getNotifications, markRead };
