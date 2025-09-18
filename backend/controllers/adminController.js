// controllers/adminController.js
const pool = require('../config/db');
const { getUserById, setUserDisabled } = require('../models/userModel');

// GET all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, username, role, disabled, created_at FROM users ORDER BY id ASC'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get All Users Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PROMOTE/DEMOTE user role
const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;

    // Validate input
    const validRoles = ['USER', 'MODERATOR', 'SUPPORT', 'ANALYST', 'ADMIN'];
    if (!userId || !role || !validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid user ID or role' });
    }

    // Prevent changing own role accidentally
    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, username, role, disabled, created_at',
      [role, userId]
    );

    if (!result.rows[0]) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({ message: 'Role updated successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Update User Role Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Disable or enable a user account.
 * Request body: { userId, disable: true|false }
 * Rules:
 *  - Cannot change your own disabled state.
 *  - MODERATOR cannot disable/enable an ADMIN.
 */
const disableUser = async (req, res) => {
  try {
    const { userId, disable } = req.body;
    const actor = req.user; // { id, role, ... }

    if (!userId || typeof disable !== 'boolean') {
      return res.status(400).json({ message: 'Invalid userId or disable flag' });
    }

    // prevent self disable/enable
    if (actor.id === parseInt(userId)) {
      return res.status(400).json({ message: 'Cannot change your own disabled status' });
    }

    const target = await getUserById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    // moderators cannot disable/enable admins
    if (actor.role === 'MODERATOR' && target.role === 'ADMIN') {
      return res.status(403).json({ message: 'Insufficient permissions to modify an ADMIN account' });
    }

    // perform update
    const updated = await setUserDisabled(userId, disable);

    res.status(200).json({
      message: disable ? 'User disabled successfully' : 'User enabled successfully',
      user: updated
    });
  } catch (err) {
    console.error('Disable User Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAllUsers, updateUserRole, disableUser };
