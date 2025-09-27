// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword as apiResetPassword } from '../services/auth.js';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ResetPassword() {
  const query = useQuery();
  const navigate = useNavigate();
  const tokenFromQuery = query.get('token') || '';
  const emailFromQuery = query.get('email') || '';

  const [token, setToken] = useState(tokenFromQuery);
  const [email] = useState(emailFromQuery);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverMsg, setServerMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists in query, prefill the hidden token field
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  const validate = () => {
    if (!token) {
      setFieldError('Invalid or missing token. Use the link in the email.');
      return false;
    }
    if (!password || password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return false;
    }
    if (password !== confirm) {
      setFieldError("Passwords don't match.");
      return false;
    }
    setFieldError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerMsg('');
    if (!validate()) return;

    try {
      setLoading(true);
      await apiResetPassword(token, password);
      setServerMsg('Password reset successful. Redirecting to sign in...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      console.error('reset-password error', err);
      const msg = err?.response?.data?.message || 'Invalid or expired token.';
      setServerMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-1 text-gray-800">Set a new password</h1>
        <p className="text-sm text-gray-500 mb-6">Create a new password for {email ? <span className="font-medium">{email}</span> : 'your account'}.</p>

        {serverMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">
            {serverMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* token is kept in state; we don't show raw token input unless user needs it */}
          <input type="hidden" value={token} />

          <div>
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="At least 8 characters"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Repeat your password"
            />
            {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
          </div>

          <div className="flex justify-between items-center">
            <Link to="/login" className="text-sm text-gray-600 hover:underline">Back to sign in</Link>
            <button
              type="submit"
              disabled={loading}
              className="ml-3 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Set new password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
