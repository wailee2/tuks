// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { resetPassword as apiResetPassword } from '../services/auth.js';
import { FiEye, FiEyeOff } from 'react-icons/fi';

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

  // --- Added from RegisterPage: password visibility + strength ---
  const [passwordScore, setPasswordScore] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  function calcPasswordScore(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // 0-4
  }

  useEffect(() => {
    // If token exists in query, prefill the hidden token field
    if (tokenFromQuery) setToken(tokenFromQuery);
  }, [tokenFromQuery]);

  useEffect(() => {
    setPasswordScore(calcPasswordScore(password));
  }, [password]);
  // --- end additions ---

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
        <h1 className="text-2xl font-semibold mb-1 text-gray-800">Create New Password</h1>
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
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="rinput"
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            {/* Strength meter (added) */}
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${(passwordScore / 4) * 100}%` }}
                  className={`h-2 rounded-full transition-all ${passwordScore <= 1 ? 'bg-red-400' : passwordScore === 2 ? 'bg-yellow-400' : 'bg-green-500'}`}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Password strength: {['Very weak', 'Weak', 'Okay', 'Good', 'Strong'][passwordScore]}</div>
            </div>
            {/* end strength meter */}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={loading}
              className="rinput"
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
            {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
          </div>

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading}
              className="fbutton"
            >
              {loading ? 'Saving...' : 'Set new password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
