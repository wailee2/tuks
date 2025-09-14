// routes/authRoutes

const express = require('express');
const { register, login, checkUsername } = require('../controllers/authController');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// username check
router.get('/check-username', checkUsername);

module.exports = router;
