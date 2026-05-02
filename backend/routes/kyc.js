const express = require('express');
const router = express.Router();
const multer = require('multer');
const kycController = require('../controllers/kycController');
const { protect, restrictTo } = require('../middleware/auth');

const upload = multer({ dest: 'uploads/kyc/', limits: { fileSize: 50 * 1024 * 1024 } });

// Subscriber endpoints
router.post('/upload', upload.array('files', 5), kycController.uploadKYC);
router.get('/status', kycController.getKYCStatus);

// Admin endpoints (protected)
router.get('/list', protect, restrictTo('Admin', 'SuperAdmin'), kycController.getKYCList);
router.get('/queue', protect, restrictTo('Admin', 'SuperAdmin'), kycController.getKYCQueue);
router.post('/approve', protect, restrictTo('Admin', 'SuperAdmin'), kycController.approveKYC);
router.post('/reject', protect, restrictTo('Admin', 'SuperAdmin'), kycController.rejectKYC);

module.exports = router;
