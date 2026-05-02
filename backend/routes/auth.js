const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { protect } = require('../middleware/auth');

// Registry-based Auth Endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/login-as', authController.loginAs);
router.post('/forgot-password', authController.forgotPassword);
router.post('/social-handshake', authController.socialHandshake);
router.post('/complete-reset', authController.completeReset);

// Session endpoints
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/verify', authController.verifySession);

module.exports = router;
