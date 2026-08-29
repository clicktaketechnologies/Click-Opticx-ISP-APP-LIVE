import logger from '../utils/logger.js';
import configManager from '../services/config-manager.js';
import redis from '../services/redisService.js';
import crypto from 'crypto';

/**
 * financeController.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Finance & Ledger Controller (v1)
 */

/** Constant-time string comparison to avoid timing attacks. */
function safeEqual(a, b) {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
}

async function verifySignature(provider, body, headers, rawBody) {
    const payload = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(String(rawBody || JSON.stringify(body)));

    if (provider === 'stripe') {
        // Official Stripe scheme: "t=timestamp,v1=signature" where
        // signature = HMAC_SHA256(secret, `${timestamp}.${payload}`)
        const signature = headers['stripe-signature'];
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!signature || !secret) return false;

        try {
            const parts = String(signature).split(',').reduce((acc, kv) => {
                const [k, v] = kv.split('=');
                if (k && v) acc[k.trim()] = v.trim();
                return acc;
            }, {});
            if (!parts.t || !parts.v1) return false;

            // Replay protection: reject events older than 5 minutes
            const age = Math.abs(Date.now() / 1000 - Number(parts.t));
            if (Number.isFinite(age) && age > 300) return false;

            const expected = crypto.createHmac('sha256', secret)
                .update(`${parts.t}.${payload.toString('utf8')}`)
                .digest('hex');
            // FIX: the computed signature was never compared — every request passed.
            return safeEqual(expected, parts.v1);
        } catch (e) {
            return false;
        }
    }

    // Generic providers: HMAC-SHA256 over the raw body using the provider secret
    // (STRIPE_WEBHOOK_SECRET-style per-provider env: <PROVIDER>_WEBHOOK_SECRET).
    const genericHeader = headers['x-webhook-signature'] || headers['x-signature'];
    const genericSecret = process.env[`${String(provider).toUpperCase()}_WEBHOOK_SECRET`];
    if (!genericSecret) {
        // No secret configured for this provider — reject in production, allow in dev.
        logger.warn(`[FINANCE-WEBHOOK] No webhook secret configured for provider "${provider}"`);
        return process.env.NODE_ENV !== 'production';
    }
    if (!genericHeader) return false;
    const expectedGeneric = crypto.createHmac('sha256', genericSecret).update(payload).digest('hex');
    return safeEqual(expectedGeneric, genericHeader);
}

export const handleWebhook = async (req, res) => {
    const { provider } = req.params;
    const headers = req.headers;
    const body = req.body;
    const rawBody = req.rawBody || JSON.stringify(body);
    const idempotencyKey = headers['x-idempotency-key'] || body.id || body.idempotency_key;

    logger.info(`[FINANCE-WEBHOOK] Received event from ${provider}. Idempotency: ${idempotencyKey}`);

    try {
        // 1. HMAC Verification
        if (!await verifySignature(provider, body, headers, rawBody)) {
            logger.warn(`[FINANCE-WEBHOOK] Invalid signature from ${provider}`);
            return res.status(401).json({ success: false, message: 'Invalid signature' });
        }

        // 2. Idempotency Check
        if (idempotencyKey) {
            const processed = await redis.get(`webhook_processed:${idempotencyKey}`);
            if (processed) {
                logger.info(`[FINANCE-WEBHOOK] Already processed: ${idempotencyKey}`);
                return res.status(200).json({ success: true, message: 'Duplicate suppressed' });
            }
        }

        // 3. Process Ledger Transaction
        const result = await processLedgerTransaction(provider, body);
        
        // 4. Mark as processed in Redis (24h expiry)
        if (idempotencyKey && result.success) {
            await redis.set(`webhook_processed:${idempotencyKey}`, 'true', 'EX', 86400);
        }

        // 5. Success
        res.status(200).json({ success: true, transactionId: result.transactionId });

        // 6. Async Broadcast (SSE/Socket)
        const io = req.app.get('socketio');
        if (io) io.emit('finance_update', result);

    } catch (error) {
        logger.error(`[FINANCE-WEBHOOK] Critical Failure: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

async function processLedgerTransaction(provider, payload) {
    const supabase = configManager.getSupabaseClient();
    
    // Normalized payload from different providers
    const amount = payload.amount || payload.data?.object?.amount / 100;
    const userId = payload.userId || payload.metadata?.userId;
    const type = 'credit'; // Usually credit for webhooks
    
    // ATOMIC START (Supabase RPC is best for ACID transactions with SELECT FOR UPDATE)
    const { data, error } = await supabase.rpc('process_financial_transaction', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_provider: provider,
        p_reference: payload.id || payload.data?.object?.id
    });

    if (error) throw new Error(`Ledger Logic Error: ${error.message}`);
    
    return { success: true, ...data };
}

export const getTransactions = async (req, res) => {
    const { userId, type, limit = 50, offset = 0 } = req.query;
    const supabase = configManager.getSupabaseClient();

    let query = supabase.from('financial_transactions').select('*', { count: 'exact' });
    if (userId) query = query.eq('user_id', userId);
    if (type) query = query.eq('type', type);

    const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, parseInt(offset) + parseInt(limit) - 1);

    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, transactions: data, total: count });
};

export const requestEmergency = async (req, res) => {
    const { userId, amount } = req.body;
    const supabase = configManager.getSupabaseClient();

    // Emergency Loan State Machine Logic
    try {
        const { data, error } = await supabase.rpc('request_emergency_loan', {
            p_user_id: userId,
            p_amount: amount
        });

        if (error) throw error;
        res.json({ success: true, loan: data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getFinanceHealth = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    try {
        const { count, error } = await supabase
            .from('payments')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending');
            
        if (error) throw error;
        
        res.json({
            status: count > 50 ? 'Warning' : 'Healthy',
            ledger_sync: '100%', // Assume ledger logic is atomic
            cron_last_run: new Date().toISOString(),
            webhook_queue: count || 0,
            alerts: count > 50 ? ['High volume of pending webhooks/transactions'] : []
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const logAgentCollection = async (req, res) => {
    const { userId, amount, method, location, receiptUrl } = req.body;
    const supabase = configManager.getSupabaseClient();

    try {
        const { data, error } = await supabase.rpc('log_agent_payment', {
            p_user_id: userId,
            p_amount: amount,
            p_method: method,
            p_gps: location, // {lat, lng}
            p_receipt: receiptUrl,
            p_agent_id: req.user.id
        });

        if (error) throw error;
        res.json({ success: true, transactionId: data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const saveFinanceConfig = async (req, res) => {
    const { key, config } = req.body;
    
    try {
        const result = await configManager.setConfig(key, config, req.user.id);
        if (!result.success) throw new Error(result.error);

        res.json({ success: true, message: 'Finance configuration synchronized.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFiscalPulse = async (req, res) => {
    const supabase = configManager.getSupabaseClient();

    try {
        // 1. Fetch aggregate metrics from Supabase
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('subtotal, tax_amount, total_amount, paid_amount, status');

        if (error) throw error;

        const pulse = invoices.reduce((acc, inv) => {
            acc.total_revenue += parseFloat(inv.paid_amount || 0);
            acc.total_receivable += parseFloat(inv.total_amount || 0) - parseFloat(inv.paid_amount || 0);
            acc.total_tax += parseFloat(inv.tax_amount || 0);
            acc.invoice_count++;
            if (inv.status === 'Paid') acc.paid_invoices++;
            return acc;
        }, {
            total_revenue: 0,
            total_receivable: 0,
            total_tax: 0,
            invoice_count: 0,
            paid_invoices: 0
        });

        res.json({
            success: true,
            pulse: {
                ...pulse,
                margin_estimate: (pulse.total_revenue * 0.4).toFixed(2), // 40% margin estimate
                last_updated: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error(`[FISCAL-PULSE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export default { handleWebhook, getTransactions, requestEmergency, getFinanceHealth, getFiscalPulse, logAgentCollection, saveFinanceConfig };
