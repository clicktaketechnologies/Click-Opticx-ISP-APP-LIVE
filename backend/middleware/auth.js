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

module.exports = { protect, restrictTo, enforceSettings };
