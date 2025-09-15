// models/userModel.js
const pool = require('../config/db');

const getUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

// case-insensitive username lookup
const getUserByUsername = async (username) => {
  const res = await pool.query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
  return res.rows[0];
};

const createUser = async (name, username, email, password) => {
  const res = await pool.query(
    'INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, username, email, password]
  );
  return res.rows[0];
};


/* --- new: searchUsers --- */
/**
 * Search users by name OR username (case-insensitive, parameterized)
 * Returns an array of objects limited to id, name, username.
 *
 * @param {string} query - search term
 * @param {number} limit - max results
 */
const searchUsers = async (query, limit = 20) => {
  // sanitize and guard
  if (!query || typeof query !== 'string') return [];

  // use ILIKE for case-insensitive pattern matching (Postgres)
  const q = `
    SELECT id, name, username
    FROM users
    WHERE (name ILIKE $1 OR username ILIKE $1)
    ORDER BY username
    LIMIT $2;
  `;
  const like = `%${query}%`;
  const r = await pool.query(q, [like, limit]);
  return r.rows;
};

module.exports = {
  getUserByEmail,
  getUserByUsername,
  createUser,
  searchUsers, // <- exported so controllers can use it
};
