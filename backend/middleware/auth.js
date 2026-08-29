import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import configManager from '../services/config-manager.js';

/** JWT secret — production refuses the missing/insecure default (see authController.getJwtSecret). */
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret === 'secret') {
        if (process.env.NODE_ENV === 'production') {
            logger.error('[AUTH-MIDDLEWARE] FATAL: JWT_SECRET missing/insecure in production. All token verification will fail.');
            throw new Error('Server misconfiguration: JWT_SECRET must be set in production.');
        }
        return 'insecure-dev-secret-do-not-use-in-production';
    }
    return secret;
};

export const protect = (req, res, next) => {
    let token;

    // 1. Check Authorization: Bearer header (API clients / mobile apps)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. Fallback: Read from httpOnly cookie (browser-based sessions after login)
    if (!token && req.headers.cookie) {
        const cookies = {};
        req.headers.cookie.split(';').forEach(c => {
            const parts = c.split('=');
            cookies[parts.shift().trim()] = decodeURIComponent(parts.join('='));
        });
        token = cookies.accessToken || cookies.access_token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = decoded;
        next();
    } catch (error) {
        logger.error(`[AUTH-MIDDLEWARE] Token invalid: ${error.message}`);
        return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
};

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        // If impersonating and trying to access restricted admin routes
        if (req.user.scope === 'user_only' && roles.includes('Admin')) {
            logger.warn(`[SECURITY] Impersonation block: User ${req.user.id} (Admin: ${req.user.impersonator_id}) attempted to access admin route.`);
            return res.status(403).json({ success: false, message: 'Access denied: Scoped session restricted to User Portal.' });
        }

        // SuperAdmin inherently has access to all restricted routes
        const allowedRoles = [...roles, 'SuperAdmin'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Access denied: Insufficient permissions.' });
        }
        next();
    };
};

export const enforceSettings = (feature) => {
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

export const requireKYC = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }
        
        // Skip KYC check for admins
        if (req.user.role === 'Admin' || req.user.role === 'SuperAdmin') {
            return next();
        }

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

export default { protect, restrictTo, enforceSettings, requireKYC };
