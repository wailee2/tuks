// routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
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

// tmp dir for multer (NOT public)
const tmpDir = path.join(__dirname, '..', 'tmp');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, tmpDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = `upload_${Date.now()}_${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, safe);
  }
});
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const fileFilter = (req, file, cb) => {
  if (!imageMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG/PNG/WebP images allowed'));
  }
  cb(null, true);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 1 * 1024 * 1024 } }); // 1MB

// --- Important: explicit routes first (so they are not captured by /:username) ---

// check username availability (optional auth)
router.get('/check-username', optionalAuth, checkUsername);

// upload avatar
router.post('/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

// Update own profile (validate + sanitize)
router.put(
  '/',
  authMiddleware,
  [
    body('username')
      .optional()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9._-]+$/).withMessage('Invalid username format'),
    body('name').optional().isLength({ max: 60 }),
    body('bio').optional().isLength({ max: 1000 }),
    // sanitize website: if user provided without protocol, prepend https://, then validate
    body('website')
      .optional({ nullable: true })
      .customSanitizer((value) => {
        if (!value) return value;
        const v = String(value).trim();
        if (!/^https?:\/\//i.test(v)) return 'https://' + v;
        return v;
      })
      .isURL().withMessage('Website must be a valid URL'),
    body('email').optional().isEmail(),
    body('dob').optional().isISO8601().toDate()
  ],
  updateProfile
);

// request delete account
router.post('/request-delete', authMiddleware, requestDelete);

// follow/unfollow (auth)
router.post('/:username/follow', authMiddleware, follow);
router.post('/:username/unfollow', authMiddleware, unfollow);

// block/unblock
router.post('/:username/block', authMiddleware, block);
router.post('/:username/unblock', authMiddleware, unblock);

// Public profile by username (must come last)
router.get('/:username', optionalAuth, getProfile);

module.exports = router;
