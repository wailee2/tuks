// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/userModel');

const SUPPORT_WHITELIST_PREFIX = '/api/support'; // whitelist support endpoints

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
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

const roleMiddleware = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
