// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { forgotPassword as apiForgotPassword } from '../services/auth.js';
import { Link } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverMsg, setServerMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!email) {
      setFieldError('Email is required');
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setFieldError('Enter a valid email');
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
      await apiForgotPassword(email.trim());
      // Always show neutral message regardless of whether account exists
      setServerMsg('If an account with that email exists, a password reset link has been sent.');
    } catch (err) {
      // keep response neutral but show friendly fallback if something else went wrong
      console.error('forgot password error', err);
      setServerMsg('If an account with that email exists, a password reset link has been sent.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center  justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-1 text-gray-800">Forgot password</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your account email and we'll send a password reset link.</p>

        {serverMsg && (
          <div className="mb-4 text-sm text-green-800 bg-green-100 p-3 rounded">
            {serverMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`finput ${fieldError ? 'border-red-400' : 'border-gray-200'} `}
              placeholder="you@example.com"
            />
            {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}
          </div>

          <div className="flex flex-col justify-between items-center">
            
            <button
              type="submit"
              disabled={loading}
              className="fbutton"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
            <div className='flex gap-2 text-sm mt-6'>
                <span className='text-gray-600 '>Remember password?</span>
                <Link
                    to="/login" 
                    className="text-green-700 underline font-medium"
                >   Login
                </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
