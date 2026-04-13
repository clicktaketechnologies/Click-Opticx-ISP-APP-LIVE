const express = require('express');
const router = express.Router();
const multer = require('multer');
const kycController = require('../controllers/kycController');

const upload = multer({ dest: 'uploads/kyc/', limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', upload.array('files', 5), kycController.uploadKYC);
router.get('/list', kycController.getKYCList);

module.exports = router;
