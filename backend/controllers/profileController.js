// backend/controllers/profileController.js
const path = require('path');
const fs = require('fs/promises');
const { validationResult } = require('express-validator');
const sharp = require('sharp');

const { buildFullUrl } = require('../helpers/url');
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
  insertAuditLog
} = require('../models/userProfileModel');

const pool = require('../config/db');

// GET profile
const getProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const viewerId = req.user ? req.user.id : null;

    // use model helper which already selects dob_visible / email_visible / location_visible
    const profile = await getPublicProfileByUsername(username, viewerId);
    if (!profile) return res.status(404).json({ message: 'User not found' });

    // prefix profile_pic with full URL if present (DB stores relative path)
    if (profile.profile_pic) {
      profile.profile_pic = profile.profile_pic.startsWith('http')
        ? profile.profile_pic
        : buildFullUrl(req, profile.profile_pic);
    }

    if (viewerId) {
      profile.is_following = await isFollowing(viewerId, profile.id);
      profile.is_blocked_by_viewer = await isBlocked(viewerId, profile.id);
      profile.has_blocked_viewer = await isBlocked(profile.id, viewerId);
    } else {
      profile.is_following = false;
      profile.is_blocked_by_viewer = false;
      profile.has_blocked_viewer = false;
    }

    return res.json(profile);
  } catch (err) {
    console.error('getProfile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Update profile
const updateProfileController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('[updateProfile] validation failed for uid=', req.user?.id, 'errors=', errors.array());
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const uid = req.user.id;
    // Only allow certain keys
    const allowed = [
      'username','name','profile_pic','bio','website','dob','dob_visible',
      'email_visible','location','location_visible','email'
    ];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        payload[k] = req.body[k];
      }
    }

    // server-side normalization
    if (payload.website && typeof payload.website === 'string') {
      payload.website = payload.website.trim() === '' ? null : payload.website.trim();
    }

    // username uniqueness
    if (payload.username) {
      const taken = await isUsernameTaken(payload.username, uid);
      if (taken) return res.status(400).json({ message: 'Username already taken' });
    }

    const before = await getUserById(uid);

    // Persist via model (model returns the canonical updated row)
    const updated = await updateUserProfile(uid, payload);

    // Audit logs
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

    // ensure returned user.profile_pic is a full URL for client convenience
    if (updated && updated.profile_pic) {
      updated.profile_pic = updated.profile_pic.startsWith('http') 
      ? updated.profile_pic
      : buildFullUrl(req, updated.profile_pic);
    }

    return res.json({
      message: 'Profile updated',
      user: {
        id: updated.id,
        username: updated.username,
        name: updated.name,
        profile_pic: updated.profile_pic,
        bio: updated.bio,
        website: updated.website,
        dob: updated.dob,
        dob_visible: updated.dob_visible,
        email: updated.email,
        email_visible: updated.email_visible,
        location: updated.location,
        location_visible: updated.location_visible,
        created_at: updated.created_at,
        updated_at: updated.updated_at
      }
    });
  } catch (err) {
    console.error('updateProfile error', err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};


// Upload avatar
// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const NODE_ENV = process.env.NODE_ENV || "development";

    // Paths
    const uploadsDirRelative = '/uploads/avatars';
    const savedFilename = req.file.filename; // multer already created filename
    const savedRelativePath = `${uploadsDirRelative}/${savedFilename}`;
    const savedFullPath = path.join(__dirname, '..', 'public', 'uploads', 'avatars', savedFilename);

    // Optional: sanitize/resize with sharp (overwrite file)
    try {
      await sharp(savedFullPath)
        .resize({ width: 512, height: 512, fit: 'cover' })
        .toFile(`${savedFullPath}.tmp`);
      await fs.rename(`${savedFullPath}.tmp`, savedFullPath);
    } catch (imgErr) {
      console.warn('sharp processing failed for avatar - continuing with original file', imgErr);
    }

    // Pick URL format depending on environment
    const avatarUrl =
      NODE_ENV === "production"
        ? `/api/profile/avatar/${savedFilename}` // secure proxy route
        : savedRelativePath; // dev: serve static file directly

    // Persist relative/proxy path to DB
    const updatedUser = await updateUserProfile(req.user.id, { profile_pic: avatarUrl });

    // Full URL + busted version for client
    const full = buildFullUrl(req, avatarUrl);
    const busted = `${full}?t=${Date.now()}`;

    if (updatedUser && updatedUser.profile_pic) {
      updatedUser.profile_pic = updatedUser.profile_pic.startsWith('http')
        ? updatedUser.profile_pic
        : buildFullUrl(req, updatedUser.profile_pic);
    }

    return res.json({
      message: 'Avatar uploaded successfully',
      profile_pic: full,
      profile_pic_busted: busted,
      user: updatedUser
    });
  } catch (err) {
    console.error('uploadAvatar error', err);
    res.status(500).json({ message: 'Server error' });
  }
};


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
