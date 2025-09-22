// context/AuthContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../services/api'; // <-- central axios instance
import { loginUser, registerUser, checkUsername as checkUsernameApi } from '../services/auth';
import { initSocket, disconnectSocket } from '../services/socket';
import { getProfile as fetchProfileFromApi } from '../services/profile';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  // store socket in a ref to avoid race conditions (and keep a state copy for consumers)
  const socketRef = useRef(null);
  const [socket, setSocket] = useState(null);

  // 🔒 force logout helper
  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      disconnectSocket();
    } catch (e) {
      console.warn('[AuthContext] disconnect on logout failed', e);
    }
    socketRef.current = null;
    setSocket(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // remove axios default auth header
    try { delete api.defaults.headers.common['Authorization']; } catch (e) { /* ignore */ }
  };


  // Setup axios interceptor once (for 403 handling)
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) {
          console.warn('[AuthContext] unauthorized/forbidden -> forcing logout', status);
          logout();
        }
        return Promise.reject(error);
      }
    );
    return () => api.interceptors.response.eject(interceptor);
  }, []);


  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [token, user]);

  // Initialize socket only when we have a valid token.
  useEffect(() => {
    if (!token) {
      try {
        disconnectSocket();
      } catch (e) {
        console.warn('[AuthContext] disconnect error', e);
      }
      socketRef.current = null;
      setSocket(null);
      return;
    }

    let mounted = true;
    try {
      const s = initSocket(token);
      socketRef.current = s;
      setSocket(s);

      const onConnect = () => console.log('[AuthContext] socket connected', s.id);
      const onConnectError = (err) => console.warn('[AuthContext] socket connect_error:', err?.message || err);
      const onDisconnect = (reason) => console.log('[AuthContext] socket disconnected:', reason);

      s.on('connect', onConnect);
      s.on('connect_error', onConnectError);
      s.on('disconnect', onDisconnect);

      return () => {
        mounted = false;
        try {
          s.off('connect', onConnect);
          s.off('connect_error', onConnectError);
          s.off('disconnect', onDisconnect);
        } catch {}
        if (socketRef.current === s) {
          try {
            disconnectSocket();
          } catch (e) {
            console.warn('[AuthContext] disconnectSocket failed', e);
          }
          socketRef.current = null;
          setSocket(null);
        }
      };
    } catch (err) {
      console.error('[AuthContext] initSocket failed', err);
      socketRef.current = null;
      setSocket(null);
    }
  }, [token]);

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('profile');
    return saved ? JSON.parse(saved) : null;
  });

  
  useEffect(() => {
    if (profile) localStorage.setItem('profile', JSON.stringify(profile));
    else localStorage.removeItem('profile');
  }, [profile]);

  useEffect(() => {
    let mounted = true;
    let fetching = false;

    if (!token || !user?.username) {
      setProfile(null);
      return;
    }

    (async () => {
      // avoid overlapping calls
      if (fetching) return;
      fetching = true;
      try {
        const p = await fetchProfileFromApi(user.username, token);
        if (!mounted) return;
        // shallow compare to avoid unnecessary setProfile (prevents re-renders)
        const same = profile && profile.id === p.id && profile.updatedAt === p.updatedAt;
        if (!same) setProfile(p);
      } catch (err) {
        console.warn('[AuthContext] fetch profile failed', err);
      } finally {
        fetching = false;
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.username, token]);

  useEffect(() => {
    let mounted = true;
    const tryBootstrap = async () => {
      // Only try when we have a persisted user but no token (common after OAuth redirect)
      if (!user || token) return;
      try {
        // call /auth/me using api (withCredentials true) so cookie/session is used
        const res = await api.get('/auth/me');
        if (!mounted) return;

        // server might return { user, token } OR just user object; handle both:
        const body = res.data || {};
        if (body.token) {
          // if server returned a token, persist it and set axios header
          api.defaults.headers.common['Authorization'] = `Bearer ${body.token}`;
          setToken(body.token);
          localStorage.setItem('token', body.token);
        }

        // update user if server returned fresh user info
        const newUser = body.user || body;
        if (newUser && newUser.username) {
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      } catch (err) {
        // harmless: cookie/session might be invalid -> do nothing (we'll let normal flows handle logout)
        console.warn('[AuthContext] cookie bootstrap /auth/me failed', err?.response?.status || err.message);
      }
    };

    tryBootstrap();
    return () => { mounted = false; };
  }, [user, token]);

  

  const login = async (email, password) => {
    const { user: u, token: t } = await loginUser(email, password);

    // Immediately persist to localStorage (synchronous)
    if (t) localStorage.setItem('token', t);
    if (u) localStorage.setItem('user', JSON.stringify(u));

    // Set axios default header immediately so subsequent requests are authenticated
    if (t) api.defaults.headers.common['Authorization'] = `Bearer ${t}`;

    // Update state
    setToken(t);
    setUser(u);

    // Return the user so callers don't need to poll localStorage
    return { user: u, token: t };
  };


  const register = async (name, username, email, password) => {
    const { user: u, token: t } = await registerUser(name, username, email, password);
    setUser(u);
    setToken(t);
  };

  const checkUsername = async (username) => {
    return await checkUsernameApi(username);
  };

  
  const refreshUser = async () => {
    try {
      if (!token) {
        // try cookie-based fetch
        const res = await api.get('/auth/me');
        const body = res.data || {};
        if (body.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${body.token}`;
          setToken(body.token);
          localStorage.setItem('token', body.token);
        }
        const newUser = body.user || body;
        if (newUser && newUser.username) {
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
          return newUser;
        }
        return null;
      }
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
      console.error('refreshUser failed', err);
      return null;
    }
  };


  const refreshProfile = async () => {
    try {
      if (!token || !user?.username) return null;
      const p = await fetchProfileFromApi(user.username, token);
      setProfile(p);
      return p;
    } catch (err) {
      console.warn('[AuthContext] refreshProfile failed', err);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, socket, profile, refreshProfile, login, register, logout, checkUsername, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};
