const express = require('express');
const router = express.Router();
const commController = require('../controllers/communicationController');
const { protect, restrictTo } = require('../middleware/auth');

router.post('/config', protect, restrictTo('Admin', 'SuperAdmin'), commController.saveConfig);
router.post('/verify', protect, restrictTo('Admin', 'SuperAdmin'), commController.verifyConnection);
router.post('/send', protect, commController.sendNotification);
router.get('/logs', protect, restrictTo('Admin', 'SuperAdmin'), commController.getLogs);

module.exports = router;
