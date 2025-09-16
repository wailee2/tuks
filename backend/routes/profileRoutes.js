// backend/routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getProfile,
  updateProfile: updateProfileController,
  uploadAvatar,
  checkUsername,
  follow,
  unfollow,
  block,
  unblock,
  requestDelete
} = require('../controllers/profileController');

const { updateProfile: updateProfileValidator } = require('../validators/profileValidators');

const router = express.Router();

// ✅ Directly store uploads in public/uploads/avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'public', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?.id || 'anon';
    cb(null, `avatar_${uid}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('Only jpeg/png/webp allowed'));
    }
    cb(null, true);
  }
});
// Check username
router.get('/check-username', authMiddleware, checkUsername);

// Public profile by username
router.get('/:username', authMiddleware, getProfile);

// Update own profile
router.put('/', authMiddleware, updateProfileValidator, updateProfileController);

// ✅ Upload avatar (direct to /public/uploads/avatars)
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);



// Follow/unfollow
router.post('/:username/follow', authMiddleware, follow);
router.post('/:username/unfollow', authMiddleware, unfollow);

// Block/unblock
router.post('/:username/block', authMiddleware, block);
router.post('/:username/unblock', authMiddleware, unblock);

// Request delete
router.post('/request-delete', authMiddleware, requestDelete);

module.exports = router;
