const pool = require('../config/db');

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY id ASC'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get All Users Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers };
