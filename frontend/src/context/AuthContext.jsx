// context/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
import { loginUser, registerUser, checkUsername as checkUsernameApi } from '../services/auth';
import { initSocket, disconnectSocket, getSocket } from '../services/socket';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // store socket in a ref to avoid race conditions (and keep a state copy for consumers)
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

  // Initialize socket only when we have a valid token.
  useEffect(() => {
    // If no token, ensure socket is disconnected and state cleared
    if (!token) {
      // disconnect helper ensures proper cleanup
      try {
        disconnectSocket();
      } catch (e) {
        console.warn('[AuthContext] disconnect error', e);
      }
      socketRef.current = null;
      setSocket(null);
      return;
    }

    // Initialize socket (initSocket should attach listeners BEFORE connecting)
    let mounted = true;
    try {
      const s = initSocket(token); // should return socket instance
      socketRef.current = s;
      setSocket(s);

      // helpful debug logs
      const onConnect = () => console.log('[AuthContext] socket connected', s.id);
      const onConnectError = (err) => console.warn('[AuthContext] socket connect_error:', err && err.message ? err.message : err);
      const onDisconnect = (reason) => console.log('[AuthContext] socket disconnected:', reason);

      s.on('connect', onConnect);
      s.on('connect_error', onConnectError);
      s.on('disconnect', onDisconnect);

      // cleanup function: only remove listeners & disconnect if this effect created the socket instance
      return () => {
        mounted = false;
        try {
          s.off('connect', onConnect);
          s.off('connect_error', onConnectError);
          s.off('disconnect', onDisconnect);
        } catch (e) {
          // ignore
        }
        // only disconnect the socket we created — do not disconnect if a new socket replaced it
        if (socketRef.current === s) {
          try {
            disconnectSocket();
          } catch (e) {
            console.warn('[AuthContext] disconnectSocket failed', e);
          }
          socketRef.current = null;
          setSocket(null);
        }
      };
    } catch (err) {
      console.error('[AuthContext] initSocket failed', err);
      // ensure no stale socket in state
      socketRef.current = null;
      setSocket(null);
    }
  }, [token]);

  const login = async (email, password) => {
    const { user: u, token: t } = await loginUser(email, password);
    setUser(u);
    setToken(t);
    // Note: socket effect will fire because token changed
  };

  const register = async (name, username, email, password) => {
    const { user: u, token: t } = await registerUser(name, username, email, password);
    setUser(u);
    setToken(t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      disconnectSocket();
    } catch (e) {
      console.warn('[AuthContext] disconnect on logout failed', e);
    }
    socketRef.current = null;
    setSocket(null);
  };

  const checkUsername = async (username) => {
    return await checkUsernameApi(username);
  };

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, checkUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
