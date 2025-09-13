import api from './api';


export const sendMessageAPI = (receiver_id, content) => api.post('/messages', { receiver_id, content });
export const getConversationAPI = (userId) => api.get(`/messages/conversation/${userId}`);
export const getNotificationsAPI = () => api.get('/messages/notifications');
export const markNotificationReadAPI = (id) => api.patch(`/messages/notifications/${id}/read`);
