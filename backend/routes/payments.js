import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// POST /api/payments/process
// SECURITY: payment processing previously accepted unauthenticated requests.
router.post('/process', protect, restrictTo('SuperAdmin', 'Admin', 'Finance Admin', 'FinanceAdmin', 'Accountant', 'Cashier'), paymentController.processPayment);

// POST /api/payments/webhooks/:gatewayId
// NOTE: intentionally left open for gateway callbacks — signature verification
// happens inside the controller. Keep this endpoint server-to-server only.
router.post('/webhooks/:gatewayId', paymentController.handleWebhook);

// POST /api/payments/test-gateway
router.post('/test-gateway', protect, restrictTo('SuperAdmin', 'Admin', 'Finance Admin', 'FinanceAdmin'), paymentController.testGatewayConnection);

export default router;
