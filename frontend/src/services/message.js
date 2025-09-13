import api from './api';

export const sendMessageAPI = async (receiver_id, content) => {
  const res = await api.post('/messages', { receiver_id, content });
  return res.data;
};

export const getConversationAPI = async (userId) => {
  const res = await api.get(`/messages/conversation/${userId}`);
  return res.data;
};
