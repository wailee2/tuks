// controllers/userController.js
const { searchUsers, getUserByUsername } = require('../models/userModel');

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


const lookupUserByUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (!username) return res.status(400).json({ message: 'username query param required' });

    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // return id, username, name, role (do not return sensitive fields)
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



module.exports = { handleSearchUsers, lookupUserByUsername };
