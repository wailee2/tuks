import api from './api';

export const sendMessage = (data) => api.post('/messages', data);
export const getConversation = (otherUserId) => api.get(`/messages/${otherUserId}`);
export const updateMessage = (messageId, data) => api.put(`/messages/${messageId}`, data);
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
