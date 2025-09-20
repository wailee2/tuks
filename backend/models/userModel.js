// models/userModel.js
const pool = require('../config/db');

// Lookup by email (includes password for login checks)
const getUserByEmail = async (email) => {
  const res = await pool.query(
    'SELECT id, name, username, email, password, role, disabled FROM users WHERE email = $1',
    [email]
  );
  return res.rows[0];
};

// Case-insensitive username lookup (includes password for login checks)
const getUserByUsername = async (username) => {
  const res = await pool.query(
    'SELECT id, name, username, email, password, role, disabled FROM users WHERE LOWER(username) = LOWER($1)',
    [username]
  );
  return res.rows[0];
};

// Create new user
const createUser = async (name, username, email, password) => {
  const res = await pool.query(
    'INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id, name, username, email, role, disabled, created_at',
    [name, username, email, password]
  );
  return res.rows[0];
};

// Get by ID (safe fields only)
const getUserById = async (id) => {
  const res = await pool.query(
    'SELECT id, name, email, username, role, disabled, created_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0];
};

// Enable/disable user
const setUserDisabled = async (id, disabled) => {
  const res = await pool.query(
    'UPDATE users SET disabled = $1 WHERE id = $2 RETURNING id, name, email, username, role, disabled, created_at',
    [disabled, id]
  );
  return res.rows[0];
};

// Find by role
const findUsersByRole = async (role) => {
  const res = await pool.query(
    'SELECT id, username, name, role FROM users WHERE role = $1',
    [role]
  );
  return res.rows;
};

// Search by username or name (case-insensitive)
const searchUsers = async (query) => {
  const res = await pool.query(
    'SELECT id, username, name, role FROM users WHERE username ILIKE $1 OR name ILIKE $1',
    [`%${query}%`]
  );
  return res.rows;
};


// Find user by google_id
const getUserByGoogleId = async (googleId) => {
  const res = await pool.query(
    'SELECT id, name, username, email, role, disabled, created_at FROM users WHERE google_id = $1',
    [googleId]
  );
  return res.rows[0];
};

// Create a user created through Google (password nullable)
const createUserWithGoogle = async (name, username, email, googleId, avatar = null) => {
  const res = await pool.query(
    `INSERT INTO users (name, username, email, google_id, avatar)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, username, email, role, disabled, created_at`,
    [name, username, email, googleId, avatar]
  );
  return res.rows[0];
};

// Attach google_id to an existing user (when user created earlier with email/password)
const setGoogleIdForUser = async (userId, googleId) => {
  const res = await pool.query(
    'UPDATE users SET google_id = $1 WHERE id = $2 RETURNING id, name, username, email, role, disabled, created_at',
    [googleId, userId]
  );
  return res.rows[0];
};


module.exports = {
  getUserByEmail,
  getUserByUsername,
  createUser,
  getUserById,
  setUserDisabled,
  findUsersByRole,
  searchUsers,
  getUserByGoogleId,
  createUserWithGoogle,
  setGoogleIdForUser
};
