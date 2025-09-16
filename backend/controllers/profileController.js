// controllers/profileController.js
const path = require('path');
const fs = require('fs/promises');
const { validationResult } = require('express-validator');
const sharp = require('sharp');
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
  requestAccountDeletion,
  insertAuditLog // we'll add this to model
} = require('../models/userProfileModel');

const pool = require('../config/db');

// GET profile (optionalAuth should have attached req.user if present)
const getProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const viewerId = req.user ? req.user.id : null;
    const profile = await getPublicProfileByUsername(username, viewerId);
    if (!profile) return res.status(404).json({ message: 'User not found' });

    // is_following/is_block flags
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

// Update profile -- server-side validation via express-validator in route
const updateProfileController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const uid = req.user.id;
    const allowed = [
      'username','name','profile_pic','bio','website','dob','dob_visible',
      'email','email_visible','location','location_visible'
    ];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) payload[k] = req.body[k];
    }

    // username change check
    if (payload.username) {
      const taken = await isUsernameTaken(payload.username, uid);
      if (taken) return res.status(400).json({ message: 'Username already taken' });
    }

    // perform update
    const before = await getUserById(uid);
    const updated = await updateUserProfile(uid, payload);

    // audit log if username changed or email changed
    if (payload.username && payload.username !== before.username) {
      await insertAuditLog({
        event_type: 'username_changed',
        user_id: uid,
        actor_id: uid,
        meta: { from: before.username, to: payload.username }
      });
    }

    if (payload.email && payload.email !== before.email) {
      await insertAuditLog({
        event_type: 'email_changed',
        user_id: uid,
        actor_id: uid,
        meta: { from: before.email, to: payload.email }
      });
    }

    res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('updateProfile error', err);
    // DEV: return detailed error to client so you can debug quickly (remove in prod)
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
    res.status(500).json({ message: 'Server error' });
  }

};


/**
 * Upload avatar:
 * - multer will place file into tmp upload location (we configure storage in route as diskStorage)
 * - we validate MIME and extension in multer fileFilter
 * - we then process via sharp to produce small/medium/large
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    // secure directories
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadsDir, { recursive: true });

    const uid = req.user.id;
    const file = req.file; // multer info
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = `avatar_${uid}_${Date.now()}`;

    // Sizes: small(64), med(256), large(1024)
    const sizes = [
      { name: 'sm', size: 64 },
      { name: 'md', size: 256 },
      { name: 'lg', size: 1024 }
    ];

    const publicPaths = {};

    // Process & write each size using sharp
    for (const s of sizes) {
      const filename = `${baseName}_${s.name}.jpg`; // normalize to jpg
      const outPath = path.join(uploadsDir, filename);

      // sharp pipeline: resize, jpeg compress
      await sharp(file.path)
        .resize(s.size, s.size, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(outPath);

      publicPaths[s.name] = `/uploads/avatars/${filename}`;
    }

    // remove tmp original
    try { await fs.unlink(file.path); } catch (e) { /* ignore */ }

    // update DB to set profile_pic as medium path (you can store object if desired)
    const updated = await updateUserProfile(uid, { profile_pic: publicPaths.md });

    // record audit
    await insertAuditLog({
      event_type: 'avatar_changed',
      user_id: uid,
      actor_id: uid,
      meta: { paths: publicPaths }
    });

    res.json({ message: 'Uploaded', profile_pic: publicPaths.md, sizes: publicPaths, user: updated });
  } catch (err) {
    console.error('uploadAvatar error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check username availability (GET /check-username?username=..)
// allow optional auth so client can pass token and exclude themselves
const checkUsernameController = async (req, res) => {
  try {
    const username = (req.query.username || '').trim();
    if (!username) return res.status(400).json({ available: false, message: 'username required' });

    const except = req.user ? req.user.id : null;
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
    await insertAuditLog({
      event_type: 'delete_requested',
      user_id: uid,
      actor_id: uid,
      meta: {}
    });
    res.json({ message: 'Account deletion requested. Data will be removed after 30 days.' });
  } catch (err) {
    console.error('requestDelete', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
 getProfile,
  updateProfile: updateProfileController,
  uploadAvatar,
  checkUsername: checkUsernameController,
  follow,
  unfollow,
  block,
  unblock,
  requestDelete
};


