// context/AuthContext.jsx

import React, { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser, checkUsername as checkUsernameApi } from '../services/auth';
import { initSocket } from "../services/socket";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

  useEffect(() => {
    if (token) {
      const s = initSocket(token);
      setSocket(s);

      return () => {
        s.disconnect();
      };
    }
  }, [token]);

  const login = async (email, password) => {
    const { user: u, token: t } = await loginUser(email, password);
    setUser(u);
    setToken(t);
  };

  // register now expects (name, username, email, password)
  const register = async (name, username, email, password) => {
    const { user: u, token: t } = await registerUser(name, username, email, password);
    setUser(u);
    setToken(t);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (socket) socket.disconnect();
  };

  // wrapper for checkUsername client function
  const checkUsername = async (username) => {
    // simply forward to the service; caller will handle response shape
    return await checkUsernameApi(username);
  };

  return (
    <AuthContext.Provider value={{ user, token, socket, login, register, logout, checkUsername }}>
      {children}
    </AuthContext.Provider>
  );
};
