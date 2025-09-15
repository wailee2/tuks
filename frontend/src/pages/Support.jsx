// pages/Support.jsx
import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import CustomerSupport from './CustomerSupport';
import SupportDashboard from './SupportDashboard';

export default function Support() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // If user was redirected from a disabled-login, always show the customer form
  if (location?.state?.from === 'disabled-login') {
    return <CustomerSupport />;
  }

  // If not logged in, show the generic customer form (it will require login to submit)
  if (!user) {
    return <CustomerSupport />;
  }

  // Only SUPPORT and ADMIN see the dashboard (but disabled-login already handled above)
  if (user.role === 'SUPPORT' || user.role === 'ADMIN') {
    return <SupportDashboard />;
  }

  // Everyone else sees the customer-facing support form
  return <CustomerSupport />;
}
