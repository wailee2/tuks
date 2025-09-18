// backend/routes/profileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const fs = require("fs");
const mime = require("mime-types");
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
    cb(null, path.join(__dirname, "..", "public", "uploads", "avatars"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = req.user?.id || "anon";
    const safeName = crypto.randomBytes(8).toString("hex"); // avoid collisions
    cb(null, `avatar_${uid}_${safeName}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedExt = [".jpg", ".jpeg", ".png", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExt.includes(ext)) {
      return cb(new Error("Only jpg, png, webp allowed"));
    }
    if (!/^image\//.test(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  }
});

//limit number of images
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 min
  max: 5, // max 5 uploads/min per IP
});

router.post(
  "/avatar",
  authMiddleware,
  uploadLimiter,
  upload.single("avatar"),
  uploadAvatar
);





// Serve avatars securely (production only)
router.get("/avatar/:filename", authMiddleware, (req, res) => {
  const filePath = path.join(__dirname, "..", "public", "uploads", "avatars", req.params.filename);

  // Prevent directory traversal
  const uploadsDir = path.join(__dirname, "..", "public", "uploads", "avatars");
  if (!filePath.startsWith(uploadsDir)) {
    return res.status(400).json({ message: "Invalid path" });
  }

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath, {
      headers: {
        "Content-Type": mime.lookup(filePath) || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000", // cache 1 year
      },
    });
  });
});

// Check username
router.get('/check-username', authMiddleware, checkUsername);

// Public profile by username
router.get('/:username', authMiddleware, getProfile);

// Update own profile
router.put('/', authMiddleware, updateProfileValidator, updateProfileController);


// Follow/unfollow
router.post('/:username/follow', authMiddleware, follow);
router.post('/:username/unfollow', authMiddleware, unfollow);

// Block/unblock
router.post('/:username/block', authMiddleware, block);
router.post('/:username/unblock', authMiddleware, unblock);

// Request delete
router.post('/request-delete', authMiddleware, requestDelete);

module.exports = router;
