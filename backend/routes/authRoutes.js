// routes/authRoutes
const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, checkUsername, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/* ---------- Per-account login limiter ---------- */
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts per account
  message: "Too many login attempts for this account. Try again later.",
  keyGenerator: (req, res) => req.body.email?.toLowerCase() || req.ip,
  handler: (req, res, next, options) => {
    console.warn(`429 Too Many Requests → Account: ${req.body.email || "unknown"} IP: ${req.ip}`);
    res.status(options.statusCode).json({ message: options.message });
  },
});

/* ---------- Per-IP login limiter ---------- */
const loginIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 login attempts per IP
  message: "Too many login attempts from this IP. Try again later.",
  handler: (req, res, next, options) => {
    console.warn(`429 Too Many Requests → IP: ${req.ip} Path: ${req.originalUrl}`);
    res.status(options.statusCode).json({ message: options.message });
  },
});

router.post('/register', register);
router.post('/login', loginIpLimiter, loginAccountLimiter, login);

// username check
router.get('/check-username', checkUsername);
router.get('/me', authMiddleware, me);

module.exports = router;
