// backend/models/userProfileModel.js
const pool = require('../config/db');

const insertAuditLog = async ({ event_type, user_id, actor_id = null, meta = {} }) => {
  const q = `INSERT INTO audit_logs (event_type, user_id, actor_id, meta) VALUES ($1, $2, $3, $4) RETURNING *`;
  const r = await pool.query(q, [event_type, user_id, actor_id, meta]);
  return r.rows[0];
};

const getPublicProfileByUsername = async (username, viewerId = null) => {
  const primaryQ = `
    SELECT
      u.id, u.username, u.name, u.profile_pic, u.bio, u.website,
      u.location, u.location_visible, u.dob, u.dob_visible,
      u.email, u.email_visible, u.created_at,
      (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) AS followers_count,
      (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count,
      (SELECT COUNT(*) FROM posts p WHERE p.created_by = u.id) AS posts_count
    FROM users u
    WHERE LOWER(u.username) = LOWER($1)
    LIMIT 1;
  `;

  const fallbackQ = `
    SELECT
      u.id, u.username, u.name, u.profile_pic, u.bio, u.website,
      u.location, u.location_visible, u.dob, u.dob_visible,
      u.email, u.email_visible, u.created_at,
      (SELECT COUNT(*) FROM follows f WHERE f.followee_id = u.id) AS followers_count,
      (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count
    FROM users u
    WHERE LOWER(u.username) = LOWER($1)
    LIMIT 1;
  `;

  try {
    const r = await pool.query(primaryQ, [username]);
    const p = r.rows[0];
    if (!p) return null;

    const isOwner = viewerId && parseInt(viewerId, 10) === parseInt(p.id, 10);

    const result = {
      id: p.id,
      username: p.username,
      name: p.name,
      profile_pic: p.profile_pic,
      bio: p.bio,
      website: p.website,
      created_at: p.created_at,
      posts_count: Number(p.posts_count || 0),
      followers_count: Number(p.followers_count || 0),
      following_count: Number(p.following_count || 0),
    };

    // include fields only if allowed for the viewer
    if (isOwner || p.email_visible) result.email = p.email || null;
    if (isOwner || p.dob_visible) result.dob = p.dob ? p.dob.toISOString().split('T')[0] : null;
    if (isOwner || p.location_visible) result.location = p.location || null;

    // include visibility flags for the owner so edit page can bind toggles
    if (isOwner) {
      result.dob_visible = !!p.dob_visible;
      result.email_visible = !!p.email_visible;
      result.location_visible = !!p.location_visible;
    }

    return result;
  } catch (err) {
    if (err && err.code === '42P01') {
      const r2 = await pool.query(fallbackQ, [username]);
      const p = r2.rows[0];
      if (!p) return null;

      const isOwner = viewerId && parseInt(viewerId, 10) === parseInt(p.id, 10);

      const result = {
        id: p.id,
        username: p.username,
        name: p.name,
        profile_pic: p.profile_pic,
        bio: p.bio,
        website: p.website,
        created_at: p.created_at,
        posts_count: 0,
        followers_count: Number(p.followers_count || 0),
        following_count: Number(p.following_count || 0),
      };

      if (isOwner || p.email_visible) result.email = p.email || null;
      if (isOwner || p.dob_visible) result.dob = p.dob ? p.dob.toISOString().split('T')[0] : null;
      if (isOwner || p.location_visible) result.location = p.location || null;

      if (isOwner) {
        result.dob_visible = !!p.dob_visible;
        result.email_visible = !!p.email_visible;
        result.location_visible = !!p.location_visible;
      }

      return result;
    }

    throw err;
  }
};

const getUserById = async (id) => {
  const r = await pool.query('SELECT id, username, name, email, role, disabled, profile_pic, bio FROM users WHERE id = $1 LIMIT 1', [id]);
  return r.rows[0];
};

const updateUserProfile = async (userId, updates = {}) => {
  const allowed = ['username', 'name', 'profile_pic', 'bio', 'website', 'dob', 'dob_visible', 'email_visible', 'location', 'location_visible', 'email'];
  const keys = Object.keys(updates).filter(k => allowed.includes(k));
  if (keys.length === 0) {
    const r = await pool.query(
      'SELECT id, username, name, profile_pic, bio, website, dob, dob_visible, email, email_visible, location, location_visible, created_at, updated_at FROM users WHERE id = $1 LIMIT 1',
      [userId]
    );
    return r.rows[0];
  }

  const setParts = keys.map((k, i) => `${k} = $${i + 1}`);
  const params = keys.map(k => updates[k]);
  params.push(userId);

  const q = `
    UPDATE users
    SET ${setParts.join(', ')}, updated_at = NOW()
    WHERE id = $${params.length}
    RETURNING id, username, name, profile_pic, bio, website, dob, dob_visible, email, email_visible, location, location_visible, created_at, updated_at;
  `;
  const r = await pool.query(q, params);
  return r.rows[0];
};

const isUsernameTaken = async (username, exceptUserId = null) => {
  if (exceptUserId) {
    const r = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2 LIMIT 1', [username, exceptUserId]);
    return r.rows.length > 0;
  } else {
    const r = await pool.query('SELECT id FROM users WHERE LOWER(username) = LOWER($1) LIMIT 1', [username]);
    return r.rows.length > 0;
  }
};

const followUser = async (followerId, followeeId) => {
  const q = `INSERT INTO follows (follower_id, followee_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`;
  const r = await pool.query(q, [followerId, followeeId]);
  return r.rows[0];
};
const unfollowUser = async (followerId, followeeId) => {
  await pool.query(`DELETE FROM follows WHERE follower_id = $1 AND followee_id = $2`, [followerId, followeeId]);
  return true;
};
const isFollowing = async (followerId, followeeId) => {
  const r = await pool.query(`SELECT 1 FROM follows WHERE follower_id = $1 AND followee_id = $2 LIMIT 1`, [followerId, followeeId]);
  return r.rows.length > 0;
};

const blockUser = async (blockerId, blockedId) => {
  const q = `INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`;
  const r = await pool.query(q, [blockerId, blockedId]);
  return r.rows[0];
};
const unblockUser = async (blockerId, blockedId) => {
  await pool.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [blockerId, blockedId]);
  return true;
};
const isBlocked = async (blockerId, blockedId) => {
  const r = await pool.query('SELECT 1 FROM blocks WHERE blocker_id = $1 AND blocked_id = $2 LIMIT 1', [blockerId, blockedId]);
  return r.rows.length > 0;
};

const requestAccountDeletion = async (userId) => {
  const r = await pool.query('UPDATE users SET delete_requested_at = NOW(), disabled = TRUE WHERE id = $1 RETURNING id, delete_requested_at', [userId]);
  return r.rows[0];
};

module.exports = {
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
};
