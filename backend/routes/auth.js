import express from 'express';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Registry-based Auth Endpoints
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/login-as', authController.loginAs);
router.post('/forgot-password', authController.forgotPassword);
router.post('/social-handshake', authController.socialHandshake);
router.post('/complete-reset', authController.completeReset);
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-otp', authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);
router.get('/check-verification-status', authController.checkVerificationStatus);


// Session endpoints
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/verify', authController.verifySession);
router.post('/change-password', protect, authController.changePassword);

export default router;
