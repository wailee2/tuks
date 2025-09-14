// src/services/messages.js
import api from './api';
import { initSocket } from './socket';

/**
 * Fetch messages with a specific user
 * GET /messages/:username?limit=50&page=0
 */
export const getMessages = async (username, { limit = 50, page = 0 } = {}) => {
  if (!username) throw new Error('username required');
  const res = await api.get(`/messages/${username}`, {
    params: { limit, page },
  });
  return res.data;
};

/**
 * Send a new message
 * POST /messages/send
 * body: { toUsername, content, type? }
 */
export const sendMessage = async ({ toUsername, content, type = 'text' }) => {
  if (!toUsername || !content) throw new Error('toUsername and content required');
  const payload = { toUsername, content, type };
  const res = await api.post('/messages/send', payload);

  try {
    initSocket(localStorage.getItem('token'));
  } catch (e) {
    // ignore
  }

  return res.data;
};

/**
 * Mark messages as read
 * POST /messages/:username/read
 */
export const markMessagesRead = async (username) => {
  if (!username) throw new Error('username required');
  const res = await api.post(`/messages/${username}/read`);
  return res.data;
};
