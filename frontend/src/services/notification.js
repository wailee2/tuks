import api from './api.js';

export const fetchNotifications = () => api.get('/notifications').then(res => res.data);
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
