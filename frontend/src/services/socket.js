import { io } from 'socket.io-client';
import { useEffect } from 'react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
let socket = null;

/**
 * Initialize socket once. If token is available it will be sent via auth.
 * Call this early in your app (e.g. App.jsx) or in components that need sockets.
 */
export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: token ? { token } : undefined,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  // Optional global listeners for logging/debugging
  socket.on('connect', () => {
    // console.debug('Socket connected', socket.id);
  });
  socket.on('disconnect', (reason) => {
    // console.debug('Socket disconnected', reason);
  });

  return socket;
};

export const getSocket = () => socket;

export const subscribe = (event, cb) => {
  if (!socket) return () => {};
  socket.on(event, cb);
  return () => socket.off(event, cb);
};

export const emit = (event, payload, ack) => {
  if (!socket) return;
  socket.emit(event, payload, ack);
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

/**
 * React hook: pass an object of { eventName: handler }
 * Example: useSocket({ 'message': onMessage })
 */
export const useSocket = (events = {}) => {
  useEffect(() => {
    // ensure socket exists and uses current token
    const token = localStorage.getItem('token');
    initSocket(token);

    const removers = [];
    Object.entries(events).forEach(([evt, handler]) => {
      if (!handler) return;
      socket.on(evt, handler);
      removers.push(() => socket.off(evt, handler));
    });

    return () => removers.forEach((fn) => fn());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.keys(events).map((k) => k).join(','));
};