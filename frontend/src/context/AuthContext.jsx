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

  // inside AuthProvider (top-level, near other refs)
  const bootstrapRanRef = useRef(false); // ensure bootstrap runs only once per mount
  const authMeCooldownRef = useRef(0);   // timestamp until which we should not call /auth/me

  const canCallAuthMe = () => {
    const now = Date.now();
    return now >= (authMeCooldownRef.current || 0);
  };


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
      if (bootstrapRanRef.current) return;
      bootstrapRanRef.current = true;

      // If we already have token in state/localStorage we can skip the cookie-only flow
      if (token) return;

      // If we're in cooldown from rate limiting, skip
      if (!canCallAuthMe()) return;

      try {
        // This request will send cookies (api has withCredentials: true)
        const res = await api.get('/auth/me');
        if (!mounted) return;
        const body = res.data || {};

        // server may return { token, user } OR just user
        if (body.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${body.token}`;
          setToken(body.token);
          localStorage.setItem('token', body.token);
        }
        const newUser = body.user || body;
        if (newUser && newUser.username) {
          setUser(newUser);
          localStorage.setItem('user', JSON.stringify(newUser));
        }
      } catch (err) {
        const status = err?.response?.status;
        console.warn('[AuthContext] cookie bootstrap /auth/me failed', status || err?.message || err);
        if (status === 429) {
          authMeCooldownRef.current = Date.now() + 60 * 1000; // 60s cooldown
        }
      }
    };

    tryBootstrap();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('oauth') === '1') {
      // clear the param so we don't run repeatedly
      const url = new URL(window.location.href);
      url.searchParams.delete('oauth');
      window.history.replaceState({}, '', url.toString());

      // attempt to refresh from cookie
      refreshUser();
    }
  }, []);



  

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
        if (!canCallAuthMe()) {
          // We're in cooldown; avoid calling the server. Return null to indicate no refresh.
          return null;
        }
        const res = await api.get('/auth/me'); // axios instance has withCredentials true
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
      const status = err?.response?.status;
      if (status === 429) {
        // set 60s cooldown to avoid hammering the rate limiter
        authMeCooldownRef.current = Date.now() + 60 * 1000;
        console.warn('[AuthContext] refreshUser 429 cooldown set for 60s');
        return null;
      }

      if (status === 401 || status === 403) {
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
