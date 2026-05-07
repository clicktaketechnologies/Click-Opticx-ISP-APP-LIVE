import express from 'express';
import financeController from '../controllers/financeController.js';
import { protect, restrictTo, enforceSettings } from '../middleware/auth.js';

const router = express.Router();

// Webhooks (Public but verified via HMAC in controller)
router.post('/webhook/:provider', financeController.handleWebhook);

// Protected Finance Routes
router.get('/transactions', protect, financeController.getTransactions);
router.post('/emergency/request', protect, enforceSettings('portal'), financeController.requestEmergency);

// Admin-Only Diagnostic & Control Routes
router.get('/health', protect, restrictTo('Admin', 'SuperAdmin'), financeController.getFinanceHealth);
router.post('/config', protect, restrictTo('Admin', 'SuperAdmin'), financeController.saveFinanceConfig);
router.post('/agent/collection', protect, restrictTo('Agent', 'Admin'), financeController.logAgentCollection);

export default router;
