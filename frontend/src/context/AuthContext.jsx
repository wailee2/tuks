// context/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../services/api'; // <-- central axios instance
import { loginUser, registerUser, checkUsername as checkUsernameApi } from '../services/auth';
import { initSocket, disconnectSocket } from '../services/socket';

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

  // 🔒 force logout helper
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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Setup axios interceptor once (for 403 handling)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 403) {
          console.warn('[AuthContext] 403 detected -> forcing logout');
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []); // run once

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

  // Initialize socket only when we have a valid token.
  useEffect(() => {
    if (!token) {
      try {
        disconnectSocket();
      } catch (e) {
        console.warn('[AuthContext] disconnect error', e);
      }
      socketRef.current = null;
      setSocket(null);
      return;
    }

    let mounted = true;
    try {
      const s = initSocket(token);
      socketRef.current = s;
      setSocket(s);

      const onConnect = () => console.log('[AuthContext] socket connected', s.id);
      const onConnectError = (err) => console.warn('[AuthContext] socket connect_error:', err?.message || err);
      const onDisconnect = (reason) => console.log('[AuthContext] socket disconnected:', reason);

      s.on('connect', onConnect);
      s.on('connect_error', onConnectError);
      s.on('disconnect', onDisconnect);

      return () => {
        mounted = false;
        try {
          s.off('connect', onConnect);
          s.off('connect_error', onConnectError);
          s.off('disconnect', onDisconnect);
        } catch {}
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
      socketRef.current = null;
      setSocket(null);
    }
  }, [token]);
  

  const login = async (email, password) => {
    const { user: u, token: t } = await loginUser(email, password);
    setUser(u);
    setToken(t);
  };

  const register = async (name, username, email, password) => {
    const { user: u, token: t } = await registerUser(name, username, email, password);
    setUser(u);
    setToken(t);
  };

  const checkUsername = async (username) => {
    return await checkUsernameApi(username);
  };

  
  const refreshUser = async () => {
    try {
      if (!token) return null;
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
      return res.data;
    } catch (err) {
      // If token invalid/403, log out client
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
      console.error('refreshUser failed', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, socket, login, register, logout, checkUsername, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
