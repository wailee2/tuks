// context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../services/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

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


  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
