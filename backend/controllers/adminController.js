import jwt from 'jsonwebtoken';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

const ROLE_RANK = { SuperAdmin: 100, Admin: 80, Manager: 60, SupportAdmin: 60, FinanceAdmin: 60, NetworkAdmin: 60, BusinessAdmin: 60, RecoveryManager: 50, SupportExecutive: 40, Accountant: 40, Cashier: 40, FieldAgent: 40, Dealer: 30, Customer: 10 };
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'secret') {
        if (process.env.NODE_ENV === 'production') throw new Error('Server misconfiguration: JWT_SECRET must be set in production.');
        return 'insecure-dev-secret-do-not-use-in-production';
    }
    return secret;
};

export const impersonate = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.id; // From auth middleware
        const supabase = configManager.getSupabaseClient();

        logger.info(`[IMPERSONATION] Admin ${adminId} requesting access to User ${userId}`);

        // 0. Privilege guard — an Admin must never escalate by impersonating a
        //    role equal to or higher than their own (e.g. impersonating a SuperAdmin).
        const actorRank = ROLE_RANK[req.user.role] ?? 0;

        // 1. Verify User exists
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const targetRank = ROLE_RANK[user.role] ?? 10;
        if (req.user.role !== 'SuperAdmin' && targetRank >= actorRank) {
            logger.warn(`[SECURITY] Impersonation escalation blocked: ${req.user.role} (${adminId}) attempted to impersonate ${user.role} (${userId}).`);
            return res.status(403).json({ success: false, message: 'Access denied: cannot impersonate a user with equal or higher privileges.' });
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
            getJwtSecret(),
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
        res.status(500).json({ success: false, message: 'An internal error occurred.' });
    }
};

export const logoutImpersonation = async (req, res) => {
    // Client-side mostly (destroy token), but we log it
    logger.info(`[IMPERSONATION-LOGOUT] Session terminated for User ${req.user.id} by Admin ${req.user.impersonator_id}`);
    res.json({ success: true, message: 'Impersonation session terminated.' });
};

export default {
    impersonate,
    logoutImpersonation
};
