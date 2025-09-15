// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initialize socket for the given token.
 * - If socket exists and connected, returns it.
 * - If socket exists but not connected, re-configures auth and connects.
 * - Attaches useful debug listeners (connect_error, connect, disconnect).
 *
 * Usage:
 *   const s = initSocket(token);
 *   // ensures handlers attached and socket.connect() is triggered.
 */
export function initSocket(token) {
  // if there's an existing socket and token changed, disconnect and recreate
  if (socket) {
    const currentToken = socket?.auth?.token;
    if (currentToken === token && socket.connected) {
      return socket;
    }
    // clean up old instance
    try { socket.off(); socket.disconnect(); } catch (e) {}
    socket = null;
  }

  // Create socket but do NOT auto-connect yet.
  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  // attach listeners BEFORE connecting
  socket.on('connect', () => {
    console.log('[socket] connected', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('[socket] disconnected', reason);
  });

  // critical: surface server-side auth errors/reasons
  socket.on('connect_error', (err) => {
    // err.message often contains server-provided reason
    console.warn('[socket] connect_error:', err && err.message ? err.message : err);
    // optional: show user-facing toast for auth failure
  });

  socket.on('reconnect_attempt', (count) => {
    console.log('[socket] reconnect attempt', count);
  });

  // finally connect
  try {
    socket.connect();
  } catch (e) {
    console.warn('[socket] connect() threw', e);
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  try {
    socket.off();
    socket.disconnect();
  } catch (e) {
    console.warn('[socket] disconnect error', e);
  } finally {
    socket = null;
  }
}

export function subscribe(event, handler) {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function emit(event, payload, ack) {
  if (!socket || !socket.connected) return;
  socket.emit(event, payload, ack);
}
