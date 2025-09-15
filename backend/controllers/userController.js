// controllers/userController.js
const { pool } = require('../config/db'); // if pool export; or require pool as earlier
const { searchUsers, getUserByUsername, findUsersByRole } = require('../models/userModel');
const poolConn = require('../config/db'); // adapt to your pool import style
const poolRef = poolConn; // if pool is default export

const handleSearchUsers = async (req, res) => {
  try {
    const q = (req.query.query || '').trim();
    console.log('[userController] search query:', q, 'from', req.ip);
    if (!q) return res.json({ users: [] });

    const limit = Math.min(50, parseInt(req.query.limit || '20', 10));
    const users = await searchUsers(q, limit);
    return res.json({ users });
  } catch (err) {
    console.error('[userController] search error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ message: 'Server error' });
  }
};




// Re-using getUserByUsername for lookup (already implemented)
// Add getUsersByRole:
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.query;
    if (!role) return res.status(400).json({ message: 'Role query param required' });

    const users = await findUsersByRole(role);
    res.json(users);
  } catch (err) {
    console.error('getUsersByRole error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const lookupUserByUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (!username) return res.status(400).json({ message: 'username query param required' });

    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      disabled: !!user.disabled
    });
  } catch (err) {
    console.error('lookupUserByUsername', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { handleSearchUsers, lookupUserByUsername, getUsersByRole };
