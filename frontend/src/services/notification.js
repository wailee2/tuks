import api from './api';

/**
 * GET /api/notifications?limit=20&page=0
 */
export const getNotifications = async ({ page = 0, limit = 20 } = {}) => {
  const res = await api.get('/notifications', { params: { page, limit } });
  return res.data;
};

/**
 * Mark a single notification as read
 * POST /api/notifications/:id/read
 */
export const markAsRead = async (notificationId) => {
  if (!notificationId) throw new Error('notificationId required');
  const res = await api.post(`/notifications/${notificationId}/read`);
  return res.data;
};

/**
 * Mark all notifications as read
 * POST /api/notifications/read-all
 */
export const markAllRead = async () => {
  const res = await api.post('/notifications/read-all');
  return res.data;
};