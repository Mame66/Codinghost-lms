const express = require('express');
const router = express.Router();
const { login, register, me } = require('../controllers/authController');
const { protect, allowRoles } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/register', protect, allowRoles('ADMIN', 'TEACHER'), register);
router.get('/me', protect, me);

module.exports = router;