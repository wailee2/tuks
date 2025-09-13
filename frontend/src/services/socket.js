// src/services/socket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

// env var - Vite requires VITE_ prefix
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Singleton socket instance for imperative usage
 * (connectSocket / send / subscribe)
 */
let _socket = null;

export const connectSocket = ({ userId, token } = {}) => {
  if (_socket && _socket.connected) return _socket;

  // include token in auth for server-side verification (authMiddlewareSocket)
  const opts = token ? { auth: { token } } : {};
  _socket = io(SOCKET_URL, opts);

  _socket.on('connect', () => {
    // join the per-user room the server expects (server used "user_<id>" or userId)
    // match what your server expects — if server expects user_<id>, send that string
    if (userId) _socket.emit('join', userId);
  });

  // handle reconnects automatically by Socket.IO
  return _socket;
};

export const disconnectSocket = () => {
  if (_socket) {
    try { _socket.disconnect(); } catch (e) {}
    _socket = null;
  }
};

export const send = (event, payload) => {
  if (!_socket) return console.warn('Socket not connected');
  _socket.emit(event, payload);
};

export const sendMessageSocket = (message) => send('send_message', message);

export const subscribeToMessages = (cb) => {
  if (!_socket) return () => {};
  _socket.on('receive_message', cb);
  return () => { if (_socket) _socket.off('receive_message', cb); };
};

export const subscribeToNotifications = (cb) => {
  if (!_socket) return () => {};
  _socket.on('new_notification', cb);
  return () => { if (_socket) _socket.off('new_notification', cb); };
};

/**
 * React hook: useSocket(userId, token)
 * - automatically connects when userId (or token) is provided
 * - automatically disconnects on cleanup
 * - returns { socket, send, subscribeToMessages, subscribeToNotifications }
 */
export const useSocket = (userId, token) => {
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId && !token) {
      // if no identity info, ensure disconnected
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // create socket instance (hook-local)
    const opts = token ? { auth: { token } } : {};
    const s = io(SOCKET_URL, opts);

    s.on('connect', () => {
      if (userId) s.emit('join', userId);
    });

    socketRef.current = s;
    setSocket(s);

    // cleanup on unmount or when userId/token changes
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocket(null);
    };
  }, [userId, token]);

  const hookSend = (event, payload) => {
    if (socketRef.current && socketRef.current.connected) socketRef.current.emit(event, payload);
  };

  const hookSubscribe = (event, cb) => {
    if (!socketRef.current) return () => {};
    socketRef.current.on(event, cb);
    return () => { if (socketRef.current) socketRef.current.off(event, cb); };
  };

  const hookSubscribeToMessages = (cb) => hookSubscribe('receive_message', cb);
  const hookSubscribeToNotifications = (cb) => hookSubscribe('new_notification', cb);

  return {
    socket,
    send: hookSend,
    subscribe: hookSubscribe,
    subscribeToMessages: hookSubscribeToMessages,
    subscribeToNotifications: hookSubscribeToNotifications,
  };
};
