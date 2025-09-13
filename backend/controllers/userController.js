// controllers/userController.js
const pool = require('../config/db');

const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, is_active FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    const { rows } = await pool.query(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, email, role',
      [role, id]
    );

    // Optional: log the action
    await pool.query(
      'INSERT INTO audit_logs (admin_id, user_id, action) VALUES ($1, $2, $3)',
      [req.user.id, id, `Changed role to ${role}`]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE users SET is_active=FALSE, updated_at=NOW() WHERE id=$1 RETURNING id, name, email, is_active',
      [id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getUsers, updateUserRole, blockUser };
