import express from 'express';
import billingService, { InvoiceState } from '../services/billingService.js';
import logger from '../utils/logger.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route GET /api/billing/ledger
 * @desc Fetch double-entry ledger records
 */
router.get('/ledger', protect, restrictTo('SuperAdmin', 'Admin', 'Accountant'), async (req, res) => {
    try {
        const { data, error } = await billingService.supabase
            .from('ledger_entries')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        logger.error(`[BILLING-LEDGER] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /api/billing/payment
 * @desc Process an invoice payment
 */
router.post('/payment', protect, async (req, res) => {
    const { invoiceId, amount, method } = req.body;
    try {
        const result = await billingService.processPayment(invoiceId, amount, method);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /api/billing/invoice/bulk-generate
 * @desc Generate invoices for a batch of users
 */
router.post('/invoice/bulk-generate', protect, restrictTo('SuperAdmin', 'Admin', 'Accountant', 'FinanceAdmin'), async (req, res) => {
    const { userIds, amount, dueDate, description } = req.body;
    try {
        if (!userIds || !Array.isArray(userIds)) throw new Error('userIds array is required');
        
        const results = [];
        for (const userId of userIds) {
            try {
                const invoice = await billingService.createInvoice(userId, amount || 0, dueDate || new Date().toISOString(), description);
                results.push({ userId, success: true, invoice });
            } catch (err) {
                results.push({ userId, success: false, error: err.message });
            }
        }
        res.json({ success: true, data: results });
    } catch (error) {
        logger.error(`[BILLING-BULK-GENERATE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route POST /api/billing/loan
 * @desc Request an emergency loan
 */
router.post('/loan', protect, async (req, res) => {
    const userId = req.user.id;
    const { amount } = req.body;
    try {
        const result = await billingService.issueEmergencyLoan(userId, amount);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route GET /api/billing/invoices
 * @desc Fetch invoices for a user
 */
router.get('/invoices', protect, async (req, res) => {
    const userId = req.query.userId || req.user.id;
    try {
        const { data, error } = await billingService.supabase
            .from('invoices')
            .select('*')
            .eq('user_id', userId)
            .order('due_date', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
