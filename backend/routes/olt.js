const express = require('express');
const router = express.Router();
const oltController = require('../controllers/oltController');

// Test OLT presence
router.post('/olt/health', oltController.checkHealth);

// Control ONU (Reboot, Reset, Signal)
router.post('/onu/action', oltController.executeOnuAction);

// Get real-time ONU status (Optical, Uptime)
router.post('/olt/onu/status', oltController.getOnuStatus);

// Set ONU Wifi/Admin password
router.post('/olt/onu/password-reset', oltController.resetOnuPassword);

// OLT Pulse Monitoring
router.post('/olt/pulse', oltController.getPulse);

// Discover unconfigured ONUs
router.post('/olt/discover', oltController.discoverOnus);

module.exports = router;
