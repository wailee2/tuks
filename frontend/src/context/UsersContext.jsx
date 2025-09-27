// src/context/UsersContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getAllUsers } from '../services/admin';
import { AuthContext } from './AuthContext';

export const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const { token, user } = useContext(AuthContext);
  const [users, setUsers] = useState(null);

  useEffect(() => {
    if (!users && token && (user?.role === 'ADMIN' || user?.role === 'OWNER')) {
      getAllUsers(token).then(setUsers).catch(() => {/* handle error */});
    }
  }, [token, user]);

  return (
    <UsersContext.Provider value={{ users, setUsers, refetch: () => getAllUsers(token).then(setUsers) }}>
      {children}
    </UsersContext.Provider>
  );
};
