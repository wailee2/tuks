// routes/authRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, checkUsername, me, forgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const passport = require("passport");
const jwt = require("jsonwebtoken");

const router = express.Router();

const isProd = process.env.NODE_ENV === 'production';

// --- REQUIRED: define CLIENT_ORIGIN from env (fallback to localhost dev URL) ---
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

/* ---------- Per-account login limiter ---------- */
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 5 attempts per account
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

// protect forgot/reset from abuse (per-IP)
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests from this IP, try again later."
});



router.post('/register', register);
router.post('/login', loginIpLimiter, loginAccountLimiter, login);

// username check
router.get('/check-username', checkUsername);
router.get('/me', authMiddleware, me);

router.get('/google', passport.authenticate('google', { scope: ['profile','email'], accessType: 'offline', prompt: 'consent' }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Build cookie options
    const cookieOpts = {
      httpOnly: true,
      secure: isProd ? true : false,            // secure required with sameSite 'none' in prod
      sameSite: isProd ? 'none' : 'lax',        // allow cross-site only in prod with secure:true
      path: '/',                                // make cookie available to /api/*
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    // Only set domain in production (set to your real domain), NOT on localhost
    if (isProd && process.env.COOKIE_DOMAIN) {
      cookieOpts.domain = process.env.COOKIE_DOMAIN;
    }

    res.cookie('token', token, cookieOpts);

    // Redirect back to client. Add a small flag so the client can proactively call /auth/me.
    const redirectTo = (process.env.CLIENT_ORIGIN || 'http://localhost:5173') + '/?oauth=1';
    res.redirect(redirectTo);
  }
);

router.post('/forgot-password', forgotLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
