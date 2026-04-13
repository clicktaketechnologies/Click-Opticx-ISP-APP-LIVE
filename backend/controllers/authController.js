const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Helper to fetch the common registry state
async function getRegistry() {
    if (!admin.apps.length) {
        logger.error('Firebase Admin not initialized');
        throw new Error('Service Unavailable');
    }
    const db = admin.firestore();
    const doc = await db.collection('registry').doc('master_state').get();
    if (!doc.exists) {
        return { users: [], signupRequests: [], settings: {} };
    }
    return doc.data();
}

// Helper to update the common registry state
async function updateRegistry(data) {
    const db = admin.firestore();
    await db.collection('registry').doc('master_state').update(data);
}

exports.signup = async (req, res) => {
    try {
        const { name, username, email, phone, password, role = 'Customer', ...otherData } = req.body;
        
        logger.info(`[SIGNUP] Attempt for: ${email || username || 'unknown'}`);
        
        // Validation
        if (!password) return res.status(400).json({ success: false, message: 'Password is required' });
        if (!username && !email && !phone) return res.status(400).json({ success: false, message: 'Identity identifier (username/email/phone) required' });

        const state = await getRegistry();
        const users = state.users || [];
        const signupRequests = state.signupRequests || [];

        // Normalize
        const normalizedEmail = email ? email.toLowerCase().trim() : '';
        const normalizedUsername = username ? username.toLowerCase().trim() : '';
        const normalizedPhone = phone ? phone.replace(/\D/g, '') : '';

        // Duplicate Check
        const exists = users.find(u => 
            (normalizedEmail && u.email === normalizedEmail) ||
            (normalizedUsername && u.username === normalizedUsername) ||
            (normalizedPhone && u.phone?.replace(/\D/g, '') === normalizedPhone)
        );

        if (exists) {
            logger.warn(`[SIGNUP] Duplicate identity detected: ${normalizedEmail || normalizedUsername}`);
            return res.status(400).json({ success: false, message: 'Identity already registered in the system' });
        }

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            id: 'USR-' + Date.now(),
            name: (name || 'New User').trim(),
            username: normalizedUsername,
            email: normalizedEmail,
            phone: normalizedPhone,
            password: hashedPassword,
            status: 'Active',
            kyc_status: 'pending',
            approval_status: 'pending',
            role: role,
            createdAt: new Date().toISOString(),
            ...otherData
        };

        const newRequest = {
            id: 'SR-' + Date.now(),
            userId: newUser.id,
            status: 'Pending',
            name: newUser.name,
            username: normalizedUsername,
            email: normalizedEmail,
            phone: normalizedPhone,
            timestamp: new Date().toISOString()
        };

        users.push(newUser);
        signupRequests.push(newRequest);

        await updateRegistry({ users, signupRequests });

        logger.info(`[SIGNUP] Success: ${newUser.id} (${newUser.username})`);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully with secure hashing.',
            user: { id: newUser.id, username: newUser.username }
        });

    } catch (error) {
        logger.error(`[SIGNUP] Critical Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server synchronization failed', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier) return res.status(400).json({ success: false, message: 'Email/Phone/Username required' });
        if (!password) return res.status(400).json({ success: false, message: 'Password required' });

        const input = identifier.toLowerCase().trim();
        const inputDigits = identifier.replace(/\D/g, '');

        logger.info(`[LOGIN] Search attempt for identifier: ${input}`);

        const state = await getRegistry();
        const users = state.users || [];
        const staff = state.staff || [];

        // Comprehensive identity lookup in both staff and users
        let user = staff.find(s => s.email?.toLowerCase() === input);
        let userType = 'staff';

        if (!user) {
            user = users.find(u => 
                (u.email?.toLowerCase() === input) ||
                (u.username?.toLowerCase() === input) ||
                (u.phone?.replace(/\D/g, '') === inputDigits && inputDigits.length >= 10)
            );
            userType = 'user';
        }

        if (!user) {
            logger.warn(`[LOGIN] User not found for: ${input}`);
            return res.status(404).json({ success: false, message: 'User not found in system' });
        }

        // Status Validation
        if (user.status === 'Disabled' || user.status === 'Blocked') {
            return res.status(403).json({ success: false, message: `Access Restricted: Status is ${user.status}` });
        }

        // Bcrypt match check with fallback for legacy unhashed passwords
        let isMatch = false;
        if (user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            isMatch = (password === user.password);
        }

        if (!isMatch) {
            logger.warn(`[LOGIN] Credential mismatch for: ${user.username || user.email}`);
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }

        // JWT Generation
        const token = jwt.sign(
            { 
              id: user.id, 
              username: user.username || user.email, 
              role: user.role,
              type: userType
            },
            process.env.JWT_SECRET || 'clickopticx-backend-key-24',
            { expiresIn: '7d' }
        );

        logger.info(`[LOGIN] Protocol satisfied. Authentication granted for ${user.id} (${userType})`);

        // Return clean user object (no password)
        const userResponse = { ...user };
        delete userResponse.password;

        res.json({
            success: true,
            token,
            type: userType,
            user: userResponse
        });

    } catch (error) {
        logger.error(`[LOGIN] Error: ${error.message}`);
        res.status(500).json({ success: false, message: 'Internal authentication error' });
    }
};
