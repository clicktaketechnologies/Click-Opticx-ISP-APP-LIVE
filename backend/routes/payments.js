const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payments/process
router.post('/process', paymentController.processPayment);

// POST /api/payments/webhooks/:gatewayId
router.post('/webhooks/:gatewayId', paymentController.handleWebhook);

module.exports = router;
