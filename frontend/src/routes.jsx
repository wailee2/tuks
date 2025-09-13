import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers.jsx';
import PageNotFound from './pages/PageNotFound';

export default function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/admin/users"
          element={user?.role === 'ADMIN' ? <AdminUsers /> : <Navigate to="/dashboard" />}
        />
        <Route path="*" element={<PageNotFound />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
