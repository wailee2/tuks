const NotificationModel = require('../models/notificationModel');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.getNotifications(req.user.id);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await NotificationModel.markAsRead(notificationId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};
