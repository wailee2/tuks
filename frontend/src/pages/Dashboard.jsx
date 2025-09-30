// pages/dashboard.jsx
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';





export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <main className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
            <p className="text-sm text-gray-500">Role: <span className="font-medium">{user.role}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">Logout</button>
          </div>
        </header>
      </main>
    </div>
  );
}
