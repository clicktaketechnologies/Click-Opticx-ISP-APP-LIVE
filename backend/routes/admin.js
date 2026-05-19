import express from 'express';
import adminController from '../controllers/adminController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// Impersonation Flow
router.post('/impersonate/:userId', protect, restrictTo('Admin', 'SuperAdmin'), adminController.impersonate);
router.post('/impersonate/logout', protect, adminController.logoutImpersonation);

export default router;
