const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registry-based Auth Endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
