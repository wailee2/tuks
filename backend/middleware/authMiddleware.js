// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/userModel');

const SUPPORT_WHITELIST_PREFIX = '/api/support'; // whitelist support endpoints

// Helper: extract token from Authorization header, cookie, or (dev-only) query string
const getTokenFromReq = (req) => {
  // 1) Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.split(' ')[1];

  // 2) httpOnly cookie (set by OAuth callback)
  if (req.cookies && req.cookies.token) return req.cookies.token;

  // 3) dev-only fallback: query parameter (NOT recommended for production)
  if (process.env.NODE_ENV !== 'production') {
    const q = req.query?.token || req.query?.access_token;
    if (q) return q;
  }

  return null;
};

const authMiddleware = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ message: 'Missing or invalid authorization token' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Load fresh user row to check role and disabled flag.
    const user = await getUserById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Invalid token: user not found' });

    // If user is disabled, allow only support endpoints (so they can appeal)
    if (user.disabled) {
      // If request path starts with the support prefix, allow
      if (req.originalUrl && req.originalUrl.startsWith(SUPPORT_WHITELIST_PREFIX)) {
        // attach minimal user info and continue
        req.user = {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
          disabled: true
        };
        return next();
      }
      // otherwise block
      return res.status(403).json({ message: 'Account disabled. Contact support to appeal.' });
    }

    // Normal, active user: attach minimal user info and continue
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (err) {
    console.error('AuthMiddleware error:', err);
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// OPTIONAL auth — does NOT fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    if (!token) {
      // no token: continue as guest
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // invalid token -> ignore it (treat as guest)
      return next();
    }

    const user = await getUserById(decoded.id);
    if (!user) return next();

    // If user disabled: still attach minimal info — controller will decide what to show
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      disabled: !!user.disabled
    };

    return next();
  } catch (err) {
    console.error('optionalAuth error:', err);
    return next(); // do not block — treat as guest
  }
};

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware, optionalAuth };
