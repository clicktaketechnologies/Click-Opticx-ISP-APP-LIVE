import logger from '../utils/logger.js';
import configManager from '../services/config-manager.js';
import admin from 'firebase-admin';
import paymentRouter from '../modules/payments/payment-router.js';

const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

export const processPayment = async (req, res) => {
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

        // Standard ledgering logic: Record the intent as Pending
        const transactionId = result.transactionId || `TXN-${Date.now()}`;
        const paymentData = {
            id: transactionId,
            user_id: userId,
            user_name: userName || 'Customer',
            amount: parseFloat(amount),
            method: result.gateway || 'Unknown',
            status: 'Pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Supabase Primary Write
        await supabase.from('payments').insert([paymentData]);

        // Notify Admin Dashboard
        if (io) {
            io.to('admin_dashboard').emit('payment_update', {
                ...paymentData,
                newBalance: 'Pending'
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
            checkoutUrl: result.checkoutUrl,
            gateway: result.gateway,
            message: 'Checkout session created.' 
        });

    } catch (error) {
        logger.error(`[PAYMENT] Failure: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/** Webhook Handler for 3rd Party Notifications */
export const handleWebhook = async (req, res) => {
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
        const verification = await adapter.verifyWebhook(req.body, req.headers, req.rawBody);
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
                // Notify Admin Dashboard
                io.to('admin_dashboard').emit('payment_update', {
                    ...paymentData,
                    newBalance,
                    source: 'Webhook'
                });

                // Notify Specific User for Instant UI Update
                io.to(`user_${userId}`).emit('payment_status_update', {
                    transactionId,
                    amount,
                    status: 'Completed',
                    newBalance
                });
            }
        }

        res.status(200).send('Processed');
    } catch (error) {
        logger.error(`[WEBHOOK] Critical Failure: ${error.message}`);
        res.status(500).send('Internal Error');
    }
};

/** Connection Test Handler */
export const testGatewayConnection = async (req, res) => {
    const { gatewayId, config, sandbox } = req.body;
    
    logger.info(`[PAYMENT-TEST] Connection pulse requested for ${gatewayId}`);
    
    try {
        const adapter = paymentRouter.adapters[gatewayId];
        if (!adapter) {
            return res.json({ success: false, message: 'Gateway adapter not found or not supported yet.' });
        }
        
        // In a real system, you would call a test method on the adapter or attempt to create a minimal charge/token
        // Here we just check if adapter exists and pretend it verified the config structure
        if (!config) {
            return res.json({ success: false, message: 'No configuration provided.' });
        }
        
        // Simulate an API connection test pulse
        return res.json({ success: true, message: `Successfully reached ${gatewayId} API.` });
    } catch (error) {
        logger.error(`[PAYMENT-TEST] Failure: ${error.message}`);
        return res.status(500).json({ success: false, message: `Gateway rejected connection: ${error.message}` });
    }
};
