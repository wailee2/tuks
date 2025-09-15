// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize or re-init socket with token.
 * Attaches debug listeners before connecting.
 */
export function initSocket(token) {
  // If same token and already connected, return existing socket
  if (socket && socket.auth?.token === token && socket.connected) return socket;

  // Clean up old socket safely
  if (socket) {
    try {
      socket.off(); // safe when socket exists
      socket.disconnect();
    } catch (e) {
      console.warn('[socket] cleanup old instance failed', e);
    }
    socket = null;
  }

  // create new socket but do NOT autoConnect true/false depending on your preference
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    auth: { token },
    autoConnect: false,
  });

  // important: attach listeners BEFORE calling connect()
  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connect_error:', err && err.message ? err.message : err);
  });

  // finally connect
  try {
    socket.connect();
  } catch (e) {
    console.warn('[socket] connect() threw', e);
  }

  return socket;
}

/** Return current socket (may be null) */
export function getSocket() {
  return socket;
}

/** Disconnect and cleanup safely */
export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.off(); // remove all listeners
    socket.disconnect();
  } catch (e) {
    console.warn('[socket] disconnect failed', e);
  } finally {
    socket = null;
  }
}

/**
 * Subscribe to an event; returns unsubscribe function.
 * This is safe even if the socket is null.
 */
export function subscribe(event, handler) {
  if (!socket) {
    // return noop unsubscribe to make cleanup easy
    return () => {};
  }
  socket.on(event, handler);
  return () => {
    try {
      socket.off(event, handler);
    } catch (e) {
      // defensive: ignore if socket is gone
      console.warn('[socket] off failed during unsubscribe', e);
    }
  };
}

/** Emit with optional ack */
export function emit(event, payload, ack) {
  if (!socket || !socket.connected) return;
  socket.emit(event, payload, ack);
}
