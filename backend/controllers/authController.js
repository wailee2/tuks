// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, getUserByUsername, getUserById, setPasswordResetToken, getUserByPasswordResetToken, clearPasswordResetToken, updatePassword  } = require('../models/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// REGISTER
const register = async (req, res) => {
  try {
    console.log('Request body:', req.body); // debug
    const { name, username, email, password } = req.body;

    // require username now
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: 'All fields are required: name, username, email, password' });

    // check existing email
    const existingByEmail = await getUserByEmail(email);
    if (existingByEmail) return res.status(400).json({ message: 'Email already in use' });

    // check existing username
    const existingByUsername = await getUserByUsername(username);
    if (existingByUsername) return res.status(400).json({ message: 'Username already taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(name, username, email, hashedPassword);

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    // single DB read returns user row (including disabled)
    const user = await getUserByEmail(email);
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    // verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Issue token even if user.disabled === true so they can access support routes.
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Safe user payload
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      disabled: !!user.disabled,
      created_at: user.created_at
    };

    // If disabled, respond with 200 but include disabled flag — frontend should show a friendly message and route them to support
    res.status(200).json({ user: safeUser, token });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// CHECK USERNAME AVAILABILITY
const checkUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (!username) return res.status(400).json({ available: false, message: 'username query param required' });
    // same validation rule as client
    if (!/^[a-zA-Z0-9._-]{3,30}$/.test(username)) {
      return res.status(400).json({ available: false, message: 'invalid username' });
    }

    const existing = await getUserByUsername(username);
    res.json({ available: !existing });
  } catch (err) {
    console.error('checkUsername error', err);
    res.status(500).json({ available: false, message: 'Server error' });
  }
};


// controllers/authController.js -> me
const me = async (req, res) => {
  try {
    console.log('[DEBUG /auth/me] req.headers.cookie =', req.headers.cookie);
    console.log('[DEBUG /auth/me] req.cookies =', req.cookies);
    console.log('[DEBUG /auth/me] req.user (attached by authMiddleware) =', req.user);

    const uid = req.user?.id;
    if (!uid) {
      console.warn('[DEBUG /auth/me] missing req.user.id -> unauthorized');
      return res.status(401).json({ message: 'Missing user id' });
    }

    const user = await getUserById(uid);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('me error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// FORGOT PASSWORD
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });

    // Always respond 200 to avoid enumeration
    const user = await getUserByEmail(email.toLowerCase());
    if (!user) {
      // respond success even if no user found
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // generate token (raw token for email), store hash in DB
    const rawToken = crypto.randomBytes(32).toString('hex'); // 64 chars
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    const expiresMinutes = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRES_MIN || '60', 10);
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await setPasswordResetToken(user.id, tokenHash, expiresAt);

    // send email with reset link
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465, // true for 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const resetUrl = `${process.env.CLIENT_ORIGIN || 'http://localhost:5173'}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || `tuks <9fernni@gmail.com>`,
      to: user.email,
      subject: 'Password reset request',
      replyTo: "no-reply@invalid.com",
      text: `Hi ${user.name || user.username},\n\nYou requested a password reset. Click the link below to set a new password. This link expires in ${expiresMinutes} minutes:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.\n\nThanks.`,
      html:  `<p>Hi ${user.name || user.username},</p>
            <p>You requested a password reset. Click the link below to set a new password. This link expires in ${expiresMinutes} minutes:</p>
            <p><a href="${resetUrl}">Reset password</a></p>
            <p>If you didn't request this, ignore this email.</p>
            <hr />
            <p style="font-size:12px;color:#666;">This is an automated message. Please do not reply.</p>`,
    };

    // send (do not fail the endpoint if email fails — log instead)
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Password reset email failed:', err);
      } else {
        console.log('Password reset email sent:', info.response || info);
      }
    });

    // neutral response
    return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('forgotPassword error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    // hash token to compare with DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await getUserByPasswordResetToken(tokenHash);
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    // optional: prevent reset for google-only users by checking user.google_id
    // If you want to block google users from using this flow, uncomment the next lines:
    //
    // if (user.google_id) {
    //   return res.status(400).json({ message: 'This account uses Google sign-in. Use Google to sign in or link a password from your profile.' });
    // }

    // hash new password and update
    const hashedPassword = await bcrypt.hash(password, 10);
    await updatePassword(user.id, hashedPassword);
    await clearPasswordResetToken(user.id);

    return res.status(200).json({ message: 'Password has been reset. You can now log in with your new password.' });
  } catch (err) {
    console.error('resetPassword error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { register, login, checkUsername, me, forgotPassword, resetPassword };
