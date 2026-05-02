const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

            req.user = decoded;
            next();
        } catch (error) {
            logger.error(`[AUTH-MIDDLEWARE] Token invalid: ${error.message}`);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

const restrictTo = (...roles) => {
    return (req, res, next) => {
        // If impersonating and trying to access restricted admin routes
        if (req.user.scope === 'user_only' && roles.includes('Admin')) {
            logger.warn(`[SECURITY] Impersonation block: User ${req.user.id} (Admin: ${req.user.impersonator_id}) attempted to access admin route.`);
            return res.status(403).json({ success: false, message: 'Access denied: Scoped session restricted to User Portal.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions.' });
        }
        next();
    };
};

const enforceSettings = (feature) => {
    const configManager = require('../services/config-manager');
    return (req, res, next) => {
        const key = feature === 'portal' ? 'portal_access' : 'app_access';
        const isEnabled = configManager.getConfig(key) ?? true;

        if (!isEnabled) {
            return res.status(503).json({ 
                success: false, 
                message: `Service Temporarily Unavailable: ${feature} access has been suspended.` 
            });
        }
        next();
    };
};

const requireKYC = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        
        // Skip KYC check for admins
        if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin') {
            return next();
        }

        const configManager = require('../services/config-manager');
        const supabase = configManager.getSupabaseClient();
        
        const { data: user, error } = await supabase
            .from('users')
            .select('kyc_status')
            .eq('id', req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.kyc_status !== 'approved') {
            return res.status(403).json({ 
                success: false, 
                message: 'KYC Required: Access denied until documents are approved.',
                kyc_status: user.kyc_status || 'unverified'
            });
        }

        next();
    } catch (error) {
        logger.error(`[KYC-MIDDLEWARE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error checking KYC status' });
    }
};

module.exports = { protect, restrictTo, enforceSettings, requireKYC };
