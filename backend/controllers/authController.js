// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail, getUserByUsername } = require('../models/userModel');


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

    // verify password (bcrypt.compare is the expensive op)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // After verifying credentials, check disabled flag
    if (user.disabled) {
      // 403 indicates the account is intentionally disabled
      return res.status(403).json({ message: 'Account disabled. Contact support to appeal.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Don't accidentally leak the hashed password in response
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      created_at: user.created_at
    };

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

module.exports = { register, login, checkUsername /* plus any other exports you already had */ };

