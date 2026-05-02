const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/auth');

// Impersonation Flow
router.post('/impersonate/:userId', protect, restrictTo('Admin', 'Super_Admin'), adminController.impersonate);
router.post('/impersonate/logout', protect, adminController.logoutImpersonation);

module.exports = router;
