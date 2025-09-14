import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers.jsx';
import Inventory from './pages/Inventory.jsx';
import Marketplace from './pages/Marketplace.jsx';
import OrdersList from './components/OrdersList.jsx';
import OrderDetails from './pages/OrderDetails.jsx';
import Cart from './pages/Cart.jsx';
import Messages from './pages/Messages.jsx';
import Notifications from './pages/Notifications.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import PageNotFound from './pages/PageNotFound';

export default function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/login" />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route
          path="/admin/users"
          element={user?.role === 'ADMIN' ? <AdminUsers /> : <Navigate to="/dashboard" />}
        />
        <Route path="/orders" element={<OrdersList />} />
        <Route path="/orders/:id" element={<OrderDetails />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
        <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />

        <Route path="/messages/:username" element={user ? <MessagesPage /> : <Navigate to="/login" />} />


        <Route path="*" element={<PageNotFound />} />
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
