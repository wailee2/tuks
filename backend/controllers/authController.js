// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, getUserByUsername, getUserById } = require('../models/userModel');


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

module.exports = { register, login, checkUsername, me };