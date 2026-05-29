import express from 'express';
import * as paymentController from '../controllers/paymentController.js';

const router = express.Router();

// POST /api/payments/process
router.post('/process', paymentController.processPayment);

// POST /api/payments/webhooks/:gatewayId
router.post('/webhooks/:gatewayId', paymentController.handleWebhook);

export default router;
