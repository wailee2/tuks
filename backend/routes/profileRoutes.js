// routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getProfile,
  updateProfile,
  uploadAvatar,
  checkUsername,
  follow,
  unfollow,
  block,
  unblock,
  requestDelete
} = require('../controllers/profileController');
const { authMiddleware, optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

// multer setup (same as yours)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'public', 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `avatar_${req.user?.id || 'anon'}_${Date.now()}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// Public profile by username (GET /:username) — optionalAuth allows guest view
router.get('/:username', optionalAuth, getProfile);

// Update own profile (requires auth)
router.put('/', authMiddleware, updateProfile);

// upload avatar (requires auth)
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

// check username availability (optional auth or auth — here we require auth so we can exclude current user)
router.get('/check-username', optionalAuth, checkUsername);

// follow/unfollow (auth)
router.post('/:username/follow', authMiddleware, follow);
router.post('/:username/unfollow', authMiddleware, unfollow);

// block/unblock
router.post('/:username/block', authMiddleware, block);
router.post('/:username/unblock', authMiddleware, unblock);

// request delete account
router.post('/request-delete', authMiddleware, requestDelete);

module.exports = router;
