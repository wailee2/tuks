// controllers/userController.js
const { searchUsers } = require('../models/userModel');

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

module.exports = { handleSearchUsers };
