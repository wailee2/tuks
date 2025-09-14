// models/userModel.js
const pool = require('../config/db');

const getUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

const getUserByUsername = async (username) => {
  const res = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return res.rows[0];
};

const createUser = async (name, username, email, password) => {
  const res = await pool.query(
    'INSERT INTO users (name, username, email, password) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, username, email, password]
  );
  return res.rows[0];
};

module.exports = { getUserByEmail, getUserByUsername, createUser };


