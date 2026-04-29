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
    
    logger.info(`[WEBHOOK] Received event from: ${gatewayId}`);
    
    // In Phase 2, we will use the ResponseMapper here to standardize the payload
    // For now, we return 200 immediately per best practices
    res.status(200).send('Webhook Received');

    // Emit event for real-time log monitor
    if (io) {
        io.to('admin_dashboard').emit('webhook_event', {
            gatewayId,
            payload: req.body,
            timestamp: new Date().toISOString()
        });
    }
};
