// controllers/profileController.js
const {
  getPublicProfileByUsername,
  getUserById,
  updateUserProfile,
  isUsernameTaken,
  followUser,
  unfollowUser,
  isFollowing,
  blockUser,
  unblockUser,
  isBlocked,
  requestAccountDeletion
} = require('../models/userProfileModel');

const pool = require('../config/db');

const getProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const viewerId = req.user ? req.user.id : null;
    const profile = await getPublicProfileByUsername(username, viewerId);
    if (!profile) return res.status(404).json({ message: 'User not found' });

    // determine follow/block state if viewer logged in
    if (viewerId) {
      profile.is_following = await isFollowing(viewerId, profile.id);
      profile.is_blocked_by_viewer = await isBlocked(viewerId, profile.id);
      profile.has_blocked_viewer = await isBlocked(profile.id, viewerId);
    } else {
      profile.is_following = false;
      profile.is_blocked_by_viewer = false;
      profile.has_blocked_viewer = false;
    }

    res.json(profile);
  } catch (err) {
    console.error('getProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const uid = req.user.id;
    const payload = {};
    const allowed = ['username', 'name', 'profile_pic', 'bio', 'website', 'dob', 'dob_visible', 'email_visible', 'location', 'location_visible', 'email'];
    allowed.forEach(k => {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) payload[k] = req.body[k];
    });

    // if username change -> check uniqueness
    if (payload.username) {
      const taken = await isUsernameTaken(payload.username, uid);
      if (taken) return res.status(400).json({ message: 'Username already taken' });
    }

    const updated = await updateUserProfile(uid, payload);
    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('updateProfile error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// upload avatar (multer should have stored file on disk)
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    // file path: req.file.path (e.g., uploads/filename.jpg)
    const publicPath = `/uploads/${req.file.filename}`; // serve statically from this path
    // update user's profile_pic
    const updated = await updateUserProfile(req.user.id, { profile_pic: publicPath });
    res.json({ message: 'Uploaded', profile_pic: publicPath, user: updated });
  } catch (err) {
    console.error('uploadAvatar', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const checkUsername = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    const except = req.user ? req.user.id : null;
    if (!username) return res.status(400).json({ available: false, message: 'username required' });
    const taken = await isUsernameTaken(username, except);
    res.json({ available: !taken });
  } catch (err) {
    console.error('checkUsername', err);
    res.status(500).json({ available: false, message: 'Server error' });
  }
};

const follow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followeeUsername = req.params.username;
    const followee = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [followeeUsername]);
    if (!followee.rows[0]) return res.status(404).json({ message: 'User not found' });

    const followeeId = followee.rows[0].id;
    if (followeeId === followerId) return res.status(400).json({ message: "Can't follow yourself" });

    // don't follow if blocker relation exists
    const blocked = await isBlocked(followeeId, followerId);
    if (blocked) return res.status(403).json({ message: 'You are blocked by this user' });

    await followUser(followerId, followeeId);
    res.json({ message: 'Followed' });
  } catch (err) {
    console.error('follow error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const unfollow = async (req, res) => {
  try {
    const followerId = req.user.id;
    const followeeUsername = req.params.username;
    const followee = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [followeeUsername]);
    if (!followee.rows[0]) return res.status(404).json({ message: 'User not found' });

    await unfollowUser(followerId, followee.rows[0].id);
    res.json({ message: 'Unfollowed' });
  } catch (err) {
    console.error('unfollow error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const block = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedUsername = req.params.username;
    const blockedUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [blockedUsername]);
    if (!blockedUser.rows[0]) return res.status(404).json({ message: 'User not found' });
    await blockUser(blockerId, blockedUser.rows[0].id);
    // also remove follow relations both ways
    await pool.query('DELETE FROM follows WHERE (follower_id=$1 AND followee_id=$2) OR (follower_id=$2 AND followee_id=$1)', [blockerId, blockedUser.rows[0].id]);
    res.json({ message: 'User blocked' });
  } catch (err) {
    console.error('block error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const unblock = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const blockedUsername = req.params.username;
    const blockedUser = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [blockedUsername]);
    if (!blockedUser.rows[0]) return res.status(404).json({ message: 'User not found' });
    await unblockUser(blockerId, blockedUser.rows[0].id);
    res.json({ message: 'User unblocked' });
  } catch (err) {
    console.error('unblock error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const requestDelete = async (req, res) => {
  try {
    const uid = req.user.id;
    await requestAccountDeletion(uid);
    // return immediate success — client should logout user
    res.json({ message: 'Account deletion requested. Data will be removed after 30 days.' });
  } catch (err) {
    console.error('requestDelete', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadAvatar,
  checkUsername,
  follow,
  unfollow,
  block,
  unblock,
  requestDelete
};
