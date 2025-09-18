// pages/Login.jsx
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from "react-icons/fi";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState(''); // used to show immediate notices like "disabled -> redirecting"

  // validate fields quickly
  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = 'Enter a valid email';
    if (!password) errs.password = 'Password is required';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // small polling helper: try reading localStorage "user" up to ~500ms
  const readLocalUserWithTimeout = async (timeoutMs = 500, stepMs = 50) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() <= deadline) {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {
          return null;
        }
      }
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, stepMs));
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setNotice('');
    if (!validate()) return;

    // in Login.jsx
    try {
      setLoading(true);

      const { user: localUser } = await login(email.trim(), password); // now login returns user

      if (!localUser) {
        // fallback
        navigate('/dashboard');
        return;
      }

      if (localUser.disabled) {
        setNotice('Your account has been disabled. Redirecting you to Support so you can submit an appeal...');
        navigate('/support', {
          state: {
            from: 'disabled-login',
            message: 'Your account is disabled. Please open a ticket to appeal this decision.'
          }
        });
        return;
      }

      navigate('/dashboard');
    }catch (err) {
      // unify axios/fetch error shapes
      const msg = err?.response?.data?.message || err?.message || 'Login failed';
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-1 text-gray-800">Welcome back</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to continue to your account</p>

        {/* Server errors */}
        {serverError && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 p-3 rounded">
            {serverError}
          </div>
        )}

        {/* Notice (e.g., disabled -> redirecting) */}
        {notice && (
          <div className="mb-4 text-sm text-yellow-800 bg-yellow-100 p-3 rounded">
            {notice}
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
              className={`mt-1 block w-full px-4 py-2 rounded-lg border ${
                fieldErrors.email ? 'border-red-400' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
              placeholder="you@example.com"
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`mt-1 block w-full px-4 py-2 rounded-lg border ${
                fieldErrors.password ? "border-red-400" : "border-gray-200"
                } focus:outline-none focus:ring-2 focus:ring-indigo-200`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
            {fieldErrors.password && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
            )}
          </div>


          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600" />
              <span className="text-sm text-gray-600">Remember me</span>
            </label>
            <a href="/forgot-password" className="text-sm text-indigo-600 hover:underline">Forgot?</a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                </svg>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account? <a href="/register" className="text-indigo-600 font-medium hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
