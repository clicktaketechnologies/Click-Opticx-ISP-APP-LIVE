const logger = require('../utils/logger');
const configManager = require('../services/config-manager');
const admin = require('firebase-admin');
const paymentRouter = require('../modules/payments/payment-router');

const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

exports.processPayment = async (req, res) => {
    const { amount, userId, invoiceId, userName } = req.body;
    const io = req.app.get('socketio');
    const supabase = configManager.getSupabaseClient();

    logger.info(`[PAYMENT] Received request for ${amount} for User ${userId}`);

    try {
        // Use the new PaymentRouter for intelligent routing and failover
        const result = await paymentRouter.processPayment({ amount, userId, invoiceId, userName });

        if (!result.success) {
            // Emit failure to admin dashboard for real-time monitoring
            if (io) {
                io.to('admin_dashboard').emit('payment_failed', {
                    userId, userName, amount, error: result.error, timestamp: new Date().toISOString()
                });
            }
            return res.status(400).json(result);
        }

        // Standard ledgering logic (as before, but enhanced)
        const transactionId = result.transactionId || `TXN-${Date.now()}`;
        const paymentData = {
            id: transactionId,
            user_id: userId,
            user_name: userName || 'Customer',
            amount: parseFloat(amount),
            method: result.gateway || 'Unknown',
            status: 'Completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Supabase Primary Write
        await supabase.from('payments').insert([paymentData]);

        // Update User Balance
        const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
        const newBalance = (user?.balance || 0) + parseFloat(amount);
        await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

        // Notify Admin Dashboard
        if (io) {
            io.to('admin_dashboard').emit('payment_update', {
                ...paymentData,
                newBalance
            });
        }

        // Mirror to Firebase
        if (isFirebaseWriteEnabled()) {
            try {
                const db = admin.firestore();
                await db.collection('payments').doc(transactionId).set(paymentData);
            } catch (fbErr) {
                logger.warn(`[PAYMENT-MIRROR] Firebase update skipped: ${fbErr.message}`);
            }
        }

        return res.json({ 
            success: true, 
            transactionId, 
            newBalance,
            gateway: result.gateway,
            message: 'Payment processed and routed successfully.' 
        });

    } catch (error) {
        logger.error(`[PAYMENT] Failure: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/** Webhook Handler for 3rd Party Notifications */
exports.handleWebhook = async (req, res) => {
    const { gatewayId } = req.params;
    const io = req.app.get('socketio');
    const supabase = configManager.getSupabaseClient();
    
    logger.info(`[WEBHOOK] Received event from: ${gatewayId}`);
    
    try {
        const adapter = paymentRouter.adapters[gatewayId];
        if (!adapter) {
            logger.warn(`[WEBHOOK] No adapter found for gateway: ${gatewayId}`);
            return res.status(404).send('Gateway not found');
        }

        // 1. Verify Signature (Security)
        const verification = await adapter.verifyWebhook(req.body, req.headers);
        if (!verification.success) {
            logger.warn(`[WEBHOOK] Signature verification failed for ${gatewayId}: ${verification.error}`);
            return res.status(401).send('Invalid Signature');
        }

        const event = verification.event;
        const transactionId = event.id || event.transactionId || (event.data?.object?.id);
        
        if (!transactionId) {
            return res.status(400).send('No transaction ID found in payload');
        }

        // 2. IDEMPOTENCY CHECK: Check if already processed
        const { data: existing } = await supabase
            .from('payments')
            .select('id')
            .eq('id', transactionId)
            .single();

        if (existing) {
            logger.info(`[WEBHOOK] Transaction ${transactionId} already processed. Skipping.`);
            return res.status(200).send('Duplicate suppressed');
        }

        // 3. Process the standardized event
        // In a real system, we'd use responseMapper here. For now, let's assume successful payment.
        const amount = event.amount || event.data?.object?.amount / 100 || 0;
        const userId = event.metadata?.userId || event.data?.object?.metadata?.userId;
        const invoiceId = event.metadata?.invoiceId || event.data?.object?.metadata?.invoiceId;

        if (userId && amount > 0) {
            const paymentData = {
                id: transactionId,
                user_id: userId,
                amount,
                method: gatewayId,
                status: 'Completed',
                invoice_id: invoiceId,
                created_at: new Date().toISOString()
            };

            await supabase.from('payments').insert([paymentData]);

            // Update User Balance (Wallet)
            const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
            const newBalance = (user?.balance || 0) + parseFloat(amount);
            await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

            logger.info(`[WEBHOOK] Successfully processed ${amount} for User ${userId} via ${gatewayId}`);

            if (io) {
                io.to('admin_dashboard').emit('payment_update', {
                    ...paymentData,
                    newBalance,
                    source: 'Webhook'
                });
            }
        }

        res.status(200).send('Processed');
    } catch (error) {
        logger.error(`[WEBHOOK] Critical Failure: ${error.message}`);
        res.status(500).send('Internal Error');
    }
};
