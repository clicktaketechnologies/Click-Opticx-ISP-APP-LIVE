const express = require('express');
const router = express.Router();
const oltController = require('../controllers/oltController');

// Test OLT presence
router.post('/olt/health', oltController.checkHealth);

// Control ONU (Reboot, Reset, Signal)
router.post('/onu/action', oltController.executeOnuAction);

// Discover unconfigured ONUs
router.post('/olt/discover', oltController.discoverOnus);

module.exports = router;
