import billingService from '../services/billingService.js';
import logger from '../utils/logger.js';

export const handleWebhookSimulate = async (req, res) => {
    const { userId, amount, method, event } = req.body;
    try {
        logger.info(`[WEBHOOK-SIMULATE] Received simulate for User ${userId}`);
        
        // Find unpaid invoices for the user and mark as paid.
        const { data: invoices, error } = await billingService.supabase
            .from('invoices')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'Unpaid');
        
        if (error) throw error;
        
        if (invoices && invoices.length > 0) {
            // Process the payment on the first unpaid invoice
            await billingService.processPayment(invoices[0].id, amount, method || 'simulated_webhook');
            logger.info(`[WEBHOOK-SIMULATE] Processed payment for invoice ${invoices[0].id}`);
        } else {
            logger.info(`[WEBHOOK-SIMULATE] No unpaid invoices found for User ${userId}`);
        }
        
        res.json({ success: true, message: 'Webhook simulated successfully.' });
    } catch (error) {
        logger.error(`[WEBHOOK-SIMULATE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const handleGenerateInvoice = async (req, res) => {
    const payload = req.body;
    try {
        const invoice = await billingService.createInvoice(
            payload.userId, 
            payload.subtotal || payload.totalAmount || 0, 
            payload.dueDate, 
            payload.items?.[0]?.description || 'Custom Bill'
        );
        logger.info(`[BILLING-INVOICE-GENERATE] Generated invoice ${invoice.id} for user ${payload.userId}`);
        res.json({ success: true, data: invoice });
    } catch (error) {
        logger.error(`[BILLING-INVOICE-GENERATE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};
