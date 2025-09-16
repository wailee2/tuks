// backend/controllers/profileController.js
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
  insertAuditLog
} = require('../models/userProfileModel');

const pool = require('../config/db');

// GET profile
const getProfile = async (req, res) => {
  try {
    const username = req.params.username;
    const viewerId = req.user ? req.user.id : null;
    const profile = await getPublicProfileByUsername(username, viewerId);
    if (!profile) return res.status(404).json({ message: 'User not found' });

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



const updateProfileController = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Log full errors for debugging
      console.warn('[updateProfile] validation failed for uid=', req.user?.id, 'errors=', errors.array());
      // Return helpful JSON for client (production can hide details if desired)
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const uid = req.user.id;
    console.log('[updateProfile] uid=', uid);
    // Only allow certain keys
    const allowed = [
      'username','name','profile_pic','bio','website','dob','dob_visible',
      'email_visible','location','location_visible'
    ];
    const payload = {};
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, k)) {
        payload[k] = req.body[k];
      }
    }

    console.log('[updateProfile] incoming payload keys/values:', payload);
    // Optional: do additional server-side normalization
    if (payload.website && typeof payload.website === 'string') {
      payload.website = payload.website.trim() === '' ? null : payload.website.trim();
    }

    // If username present, check uniqueness
    if (payload.username) {
      const taken = await isUsernameTaken(payload.username, uid);
      if (taken) return res.status(400).json({ message: 'Username already taken' });
    }

    // Save before/after for audit
    const before = await getUserById(uid);
    const updated = await updateUserProfile(uid, payload);

    // Audit logs (username/email changes)
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

    // Return updated user row
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('updateProfile error', err);
    if (process.env.NODE_ENV !== 'production') {
      return res.status(500).json({ message: err.message, stack: err.stack });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};




// upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Build public URL for the uploaded file
    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    // Save `fileUrl` to DB (example)
    // await updateUserProfile(req.user.id, { profile_pic: fileUrl });

    res.json({
      message: 'Avatar uploaded successfully',
      url: fileUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



// checkUsername
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

