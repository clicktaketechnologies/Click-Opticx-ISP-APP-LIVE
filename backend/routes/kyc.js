import express from 'express';
import multer from 'multer';
import kycController from '../controllers/kycController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/kyc/', limits: { fileSize: 50 * 1024 * 1024 } });

// Subscriber endpoints
router.post('/upload', protect, upload.array('files', 5), kycController.uploadKYC);
router.get('/status', protect, kycController.getKYCStatus);

// Admin endpoints (protected)
router.get('/list', protect, restrictTo('Admin', 'SuperAdmin'), kycController.getKYCList);
router.get('/queue', protect, restrictTo('Admin', 'SuperAdmin'), kycController.getKYCQueue);
router.post('/approve', protect, restrictTo('Admin', 'SuperAdmin'), kycController.approveKYC);
router.post('/reject', protect, restrictTo('Admin', 'SuperAdmin'), kycController.rejectKYC);

export default router;
