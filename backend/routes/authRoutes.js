// routes/authRoutes

const express = require('express');
const { register, login, checkUsername, me } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// username check
router.get('/check-username', checkUsername);
router.get('/me', authMiddleware, me);

module.exports = router;
