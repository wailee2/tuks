import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Modern registration page component using Tailwind v4 classes
// Expects AuthContext.register(name, username, email, password) and AuthContext.checkUsername(username)

export default function RegisterPage() {
  const { register, checkUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // username availability states
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null = unknown, true/false = known
  const usernameTimer = useRef(null);
  const lastChecked = useRef('');

  useEffect(() => {
    setPasswordScore(calcPasswordScore(form.password));
  }, [form.password]);

  useEffect(() => {
    // debounce username availability check using AuthContext.checkUsername
    const username = (form.username || '').trim().toLowerCase();
    setUsernameAvailable(null); // reset while typing

    if (usernameTimer.current) {
      clearTimeout(usernameTimer.current);
      usernameTimer.current = null;
    }

    if (!username || username.length < 3) {
      setCheckingUsername(false);
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    usernameTimer.current = setTimeout(async () => {
      if (lastChecked.current === username) {
        setCheckingUsername(false);
        return;
      }
      lastChecked.current = username;
      try {
        const res = await checkUsername(username);
        // checkUsername may return { available: true } or boolean
        const available = typeof res === 'boolean' ? res : Boolean(res?.available);
        setUsernameAvailable(available);
        if (!available) setErrors(prev => ({ ...prev, username: 'Username already taken' }));
        else setErrors(prev => ({ ...prev, username: '' }));
      } catch (err) {
        console.error('Username check failed', err);
        // network failure: do not block user, just mark unknown
        setUsernameAvailable(null);
      } finally {
        setCheckingUsername(false);
      }
    }, 600);

    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
    };
  }, [form.username, checkUsername]);

  function calcPasswordScore(pw) {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (/[A-Z]/.test(pw)) score += 1;
    if (/[0-9]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;
    return score; // 0-4
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (!/^[a-zA-Z0-9._-]{3,30}$/.test(form.username)) e.username = 'Username must be 3-30 characters: letters, numbers, . _ - allowed';
    else if (usernameAvailable === false) e.username = 'Username already taken';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  }

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((errs) => ({ ...errs, [e.target.name]: '' }));
    // reset form-level errors
    setErrors(errs => ({ ...errs, form: '' }));
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setSuccessMessage('');
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      await register(form.name.trim(), form.username.trim().toLowerCase(), form.email.trim(), form.password);
      setSuccessMessage('Account created — redirecting...');
      // small delay so user sees message
      setTimeout(() => navigate('/'), 900);
    } catch (err) {
      console.error('Registration error', err);
      const msg = err?.response?.data?.message || err?.message || 'Registration failed';
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Create a secure account to continue. Username is required.</p>

        {errors.form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded mb-4">{errors.form}</div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded mb-4">{successMessage}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.name ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Your full name"
              autoComplete="name"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.username ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="username (letters, numbers, ., _, -)"
                autoComplete="username"
              />
              <div className="absolute right-3 top-2 text-xs">
                {checkingUsername ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
                    checking
                  </span>
                ) : usernameAvailable === true ? (
                  <span className="text-xs text-green-600 font-medium">available</span>
                ) : usernameAvailable === false ? (
                  <span className="text-xs text-red-600 font-medium">taken</span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
              <div>Lowercase recommended. No spaces.</div>
              <div>Preview: <span className="font-medium">{form.username ? form.username.toLowerCase() : '—'}</span></div>
            </div>
            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.email ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={onChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.password ? 'border-red-300' : 'border-gray-200'}`}
                placeholder="Create a strong password"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-2 top-2 text-xs text-gray-500">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  style={{ width: `${(passwordScore / 4) * 100}%` }}
                  className={`h-2 rounded-full transition-all ${passwordScore <= 1 ? 'bg-red-400' : passwordScore === 2 ? 'bg-yellow-400' : 'bg-green-500'}`}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">Password strength: {['Very weak', 'Weak', 'Okay', 'Good', 'Strong'][passwordScore]}</div>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              name="confirm"
              type="password"
              value={form.confirm}
              onChange={onChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.confirm ? 'border-red-300' : 'border-gray-200'}`}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />
            {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
              ) : null}
              <span>{loading ? 'Creating account...' : 'Create account'}</span>
            </button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-gray-500">
          Already have an account? <a className="text-indigo-600 font-medium hover:underline" href="/login">Sign in</a>
        </div>
      </div>
    </div>
  );
}
