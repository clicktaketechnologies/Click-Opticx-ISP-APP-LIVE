const jwt = require('jsonwebtoken');
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

exports.impersonate = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.id; // From auth middleware
        const supabase = configManager.getSupabaseClient();

        logger.info(`[IMPERSONATION] Admin ${adminId} requesting access to User ${userId}`);

        // 1. Verify User exists
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 2. Generate Scoped JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                role: user.role,
                scope: 'user_only',
                impersonator_id: adminId,
                original_role: req.user.role,
                is_impersonating: true
            },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' } // 900s as requested
        );

        // 3. Log Action
        logger.info(`[IMPERSONATION] Scoped session granted for ${user.email} (Admin: ${adminId})`);
        
        res.json({ 
            success: true, 
            token, 
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        logger.error(`[IMPERSONATION] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.logoutImpersonation = async (req, res) => {
    // Client-side mostly (destroy token), but we log it
    logger.info(`[IMPERSONATION-LOGOUT] Session terminated for User ${req.user.id} by Admin ${req.user.impersonator_id}`);
    res.json({ success: true, message: 'Impersonation session terminated.' });
};
