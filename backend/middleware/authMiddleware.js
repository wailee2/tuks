// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { getUserById } = require('../models/userModel');

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

    // IMPORTANT: block disabled users on every request (this blocks existing tokens)
    if (user.disabled) {
      return res.status(403).json({ message: 'Account disabled. Contact support to appeal.' });
    }

    // attach minimal user info
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
