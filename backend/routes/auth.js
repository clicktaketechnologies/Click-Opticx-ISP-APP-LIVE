import express from 'express';
import rateLimit from 'express-rate-limit';
import authController from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Strict per-endpoint rate limiters (defense in depth on top of the global limiter) ───
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // 10 login attempts / 15 min / IP
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many login attempts from this IP. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 signups / hour / IP
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many signup attempts. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // 5 OTP verifications or resends / 15 min
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many OTP attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5, // 5 password reset requests / hour / IP
    message: { success: false, error: 'RATE_LIMITED', message: 'Too many password reset attempts. Try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Registry-based Auth Endpoints
router.post('/signup', signupLimiter, authController.signup);
router.post('/login', loginLimiter, authController.login);
router.post('/login-as', authController.loginAs);
router.post('/forgot-password', resetLimiter, authController.forgotPassword);
router.post('/social-handshake', authController.socialHandshake);
router.post('/complete-reset', resetLimiter, authController.completeReset);
router.get('/verify-email', authController.verifyEmail);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/resend-otp', otpLimiter, authController.resendOtp);
router.get('/check-verification-status', authController.checkVerificationStatus);

// Session endpoints
router.post('/refresh', authController.refreshToken);
router.post('/logout', protect, authController.logout);
router.get('/verify', authController.verifySession);
router.post('/change-password', protect, authController.changePassword);

export default router;
