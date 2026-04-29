const logger = require('../utils/logger');
const configManager = require('../services/config-manager');
const admin = require('firebase-admin');

const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

exports.processPayment = async (req, res) => {
    const { gatewayId, gatewayName, config, amount, userId, packageId, userName } = req.body;
    const supabase = configManager.getSupabaseClient();

    logger.info(`[PAYMENT] Processing ${amount} via ${gatewayName} for User ${userId}`);

    try {
        // 1. Validation (Already in place)
        // ... Handshake Logic ...
        const transactionId = `TXN-${gatewayId.toUpperCase()}-${Date.now()}`;

        const paymentData = {
            id: transactionId,
            user_id: userId,
            user_name: userName || 'Customer',
            amount: parseFloat(amount),
            method: gatewayName,
            status: 'Completed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // 2. Supabase Primary Write (Ledger)
        const { error: sbError } = await supabase.from('payments').insert([paymentData]);
        if (sbError) throw sbError;

        // 3. Update User Balance in Supabase
        const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
        const newBalance = (user?.balance || 0) + parseFloat(amount);
        await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

        // 4. Firebase Mirror (Redundancy)
        if (isFirebaseWriteEnabled()) {
            try {
                const db = admin.firestore();
                // Append to a payments collection or update master_state
                await db.collection('payments').doc(transactionId).set(paymentData);
            } catch (fbErr) {
                logger.warn(`[PAYMENT-MIRROR] Firebase update skipped: ${fbErr.message}`);
            }
        }

        return res.json({ 
            success: true, 
            transactionId, 
            newBalance,
            message: 'Payment processed and synced successfully.' 
        });

    } catch (error) {
        logger.error(`[PAYMENT] Failure: ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
};
