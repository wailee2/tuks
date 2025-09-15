// src/services/messages.js
// API helpers for messages. All endpoints assume your server routes from
// server.js: /api/messages, /api/users/search etc.
// These functions import from your main axios wrapper (src/services/api.js).

import api from './api';

/**
 * Send a message to a user (by username)
 * POST /api/messages/send  { toUsername, content, type? }
 */
export async function sendMessage(toUsername, content, type = 'text') {
  const res = await api.post('/messages/send', { toUsername, content, type });
  return res.data; // { message, notification }
}

/**
 * Fetch messages between current user and username
 * GET /api/messages/:username?limit=50&page=0
 */
export async function fetchMessages(username, { limit = 50, page = 0 } = {}) {
  const res = await api.get(`/messages/${encodeURIComponent(username)}?limit=${limit}&page=${page}`);
  return res.data; // { messages }
}

/**
 * Mark messages from username as read
 * POST /api/messages/:username/read
 */
export async function markRead(username) {
  const res = await api.post(`/messages/${encodeURIComponent(username)}/read`);
  return res.data; // { updatedCount }
}

/**
 * Simple user search for sidebar search-as-you-type.
 * Assumes your server exposes GET /api/users/search?query=...
 * If you don't have this route, implement it server-side to query users table by name/username.
 */
export async function searchUsers(query) {
  if (!query || query.trim().length === 0) return { users: [] };
  const res = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
  return res.data; // { users: [...] }
}

/**
 * Edit a message (optional - server must support PUT /api/messages/:id)
 */
export async function editMessage(messageId, newContent) {
  const res = await api.put(`/messages/${messageId}`, { content: newContent });
  return res.data;
}

/**
 * Delete a message (optional - server must support DELETE /api/messages/:id)
 */
export async function deleteMessage(messageId) {
  const res = await api.delete(`/messages/${messageId}`);
  return res.data;
}
