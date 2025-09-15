import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Sidebar from './components/Sidebar.jsx';

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
import Support from './pages/Support.jsx'
import PageNotFound from './pages/PageNotFound';
import ErrorBoundary from './components/ErrorBoundary';

export default function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <Router>
      <div className='flex flex-col md:flex-row min-h-screen'>
        <div className='md:static'>
          <Sidebar />
        </div>
        
        <main className='flex-1 overflow-y-auto pb-20 md:pb-0'>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/inventory" element={user ? <Inventory /> : <Navigate to="/login" />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route
              path="/manage-users"
              element={user?.role === 'ADMIN' ? <AdminUsers /> : <Navigate to="/dashboard" />}
            />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/cart" element={<Cart />} />


            // in routes.jsx: replace both message route lines with this
            <Route
              path="/messages/*"
              element={
                <ErrorBoundary fallback={<div className="p-4">Messages failed to load — try refreshing.</div>}>
                  <Messages />
                </ErrorBoundary>
              }
            />


            <Route path="/support" element={<Support />} />
            


            <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />



            <Route path="*" element={<PageNotFound />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
