const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registry-based Auth Endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/login-as', authController.loginAs);
router.post('/forgot-password', authController.forgotPassword);
router.post('/social-handshake', authController.socialHandshake);
router.post('/complete-reset', authController.completeReset);

module.exports = router;
