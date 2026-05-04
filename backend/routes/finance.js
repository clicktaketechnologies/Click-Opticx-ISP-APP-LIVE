const express = require('express');
const router = express.Router();
const financeController = require('../controllers/financeController');
const { protect, restrictTo, enforceSettings } = require('../middleware/auth');

// Webhooks (Public but verified via HMAC in controller)
router.post('/webhook/:provider', financeController.handleWebhook);

// Protected Finance Routes
router.get('/transactions', protect, financeController.getTransactions);
router.post('/emergency/request', protect, enforceSettings('portal'), financeController.requestEmergency);

// Admin-Only Diagnostic & Control Routes
router.get('/health', protect, restrictTo('Admin', 'SuperAdmin'), financeController.getFinanceHealth);
router.post('/config', protect, restrictTo('Admin', 'SuperAdmin'), financeController.saveFinanceConfig);
router.post('/agent/collection', protect, restrictTo('Agent', 'Admin'), financeController.logAgentCollection);

module.exports = router;
