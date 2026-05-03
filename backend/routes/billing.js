const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
// Assuming we have a ledger service or direct DB access
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * @route GET /api/billing/ledger
 * @desc Fetch double-entry ledger records
 */
router.get('/ledger', async (req, res) => {
    try {
        const { data, error } = await supabase
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
 * @route POST /api/billing/ledger
 * @desc Create a double-entry ledger record
 */
router.post('/ledger', async (req, res) => {
    const { debit_account, credit_account, amount, description, reference_type, reference_id } = req.body;
    
    try {
        // Implementation of double-entry logic (debit one, credit another)
        // This usually involves a stored procedure in Supabase for atomicity
        const { data, error } = await supabase.rpc('create_ledger_entry', {
            p_debit_acc: debit_account,
            p_credit_acc: credit_account,
            p_amount: amount,
            p_desc: description,
            p_ref_type: reference_type,
            p_ref_id: reference_id
        });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        logger.error(`[BILLING-LEDGER-POST] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
