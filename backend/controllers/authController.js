import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import supabaseAuth from '../modules/auth/supabase-auth.js';
import roleSync from '../modules/auth/role-sync.js';
import configManager from '../services/config-manager.js';
import emailWorker from '../modules/email/worker.js';

// Helper to determine if we should write to Firebase
const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

export const signup = async (req, res) => {
    try {
        const { name, username, email, phone, password, role = 'Customer', ...otherData } = req.body;
        const supabase = configManager.getSupabaseClient();
        
        logger.info(`[SIGNUP] Attempt for: ${email || username}`);
        
        // 1. Supabase Check (Primary)
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .or(`email.eq.${email},username.eq.${username}`)
            .single();

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userId = 'USR-' + Date.now();

        // --- ROLE ESCALATION FIX: Force default to 'Customer' ---
        // Admin roles can only be assigned by Super Admins via Staff Management
        const assignedRole = 'Customer'; 

        const newUser = {
            id: userId,
            name: name,
            username: username,
            email: email,
            phone: phone,
            password: hashedPassword,
            role: assignedRole,
            status: 'Active',
            created_at: new Date().toISOString()
        };

        // 2. Supabase Primary Write
        const { error: sbError } = await supabase.from('users').insert([newUser]);
        if (sbError) throw sbError;

        // 3. Supabase Auth Registration
        if (email) {
            await supabaseAuth.signUp({
                email,
                password,
                metadata: { id: userId, role }
            });
        }

        // 4. Firebase Mirror (Only if enabled)
        if (isFirebaseWriteEnabled()) {
            try {
                const db = admin.firestore();
                const doc = await db.collection('registry').doc('master_state').get();
                const state = doc.exists ? doc.data() : { users: [] };
                state.users.push(newUser);
                await db.collection('registry').doc('master_state').update({ users: state.users });
            } catch (fbErr) {
                logger.warn(`[MIRROR] Firebase update skipped/failed: ${fbErr.message}`);
            }
        }

        res.status(201).json({ success: true, userId });
    } catch (error) {
        logger.error(`[SIGNUP] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const supabase = configManager.getSupabaseClient();

        // Primary Lookup: Supabase users table
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
            .single();

        // Secondary Lookup: Supabase staff table
        if (!user || error) {
            const { data: staffUser, error: staffError } = await supabase
                .from('staff')
                .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
                .single();
            
            user = staffUser;
            error = staffError;
        }

        // If Supabase didn't find the user, fall back to local admin credentials (hard‑coded for testing)
        const adminEmail = 'admin@clickopticx.com';
        const adminPass = 'Click@Opticx2026';
        if (identifier.toLowerCase() === adminEmail && password === adminPass) {
          const adminUser = {
            id: 'STAFF-ADMIN',
            name: 'System Administrator',
            email: adminEmail,
            role: 'SUPER_ADMIN',
          };
          const token = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
          return res.json({ success: true, token, user: adminUser });
        }



        // If no user was found in Supabase and not admin, return a clear error
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        
let isMatch = false;
if (user.password) {
  isMatch = await bcrypt.compare(password, user.password);
}

// Legacy plaintext fallback for unmigrated staff/admin accounts
if (!isMatch && password === user.password) {
  isMatch = true;
  logger.info(`[LOGIN] Legacy plaintext password match for: ${user.id}`);
}

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({ success: true, token, user });
    } catch (error) {
        logger.error(`[LOGIN] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const socialHandshake = async (req, res) => {
    try {
        const { email, phone, name, provider } = req.body;
        const supabase = configManager.getSupabaseClient();
        
        logger.info(`[SOCIAL-HANDSHAKE] Verification for: ${email || phone} via ${provider}`);
        
        // Lookup or Create
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},phone.eq.${phone}`)
            .single();

        if (!user) {
            // Auto-signup logic for social
            const userId = 'USR-' + Date.now();
            user = {
                id: userId,
                name,
                email,
                phone,
                role: 'Customer',
                status: 'Active',
                created_at: new Date().toISOString()
            };
            await supabase.from('users').insert([user]);
            logger.info(`[SOCIAL-HANDSHAKE] Created new user: ${userId}`);
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '7d' }
        );

        res.json({ success: true, token, user });
    } catch (error) {
        logger.error(`[SOCIAL-HANDSHAKE] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const supabase = configManager.getSupabaseClient();

        let { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('id, name').eq('email', email).single();
            user = staffUser;
        }
        
        if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

        const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        // Send via new Email Infrastructure
        await emailWorker.queueEmail({
            to: email,
            subject: 'Password Reset Request',
            html: `<h3>Hello ${user.name}</h3><p>Click the link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`
        });

        res.json({ success: true, message: 'Reset link sent to your email.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const completeReset = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const supabase = configManager.getSupabaseClient();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Try updating user first
        let { data: userUpdateData, error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', decoded.id)
            .select('email');

        let user = userUpdateData?.[0];

        // If not in users, update staff
        if (!user || userUpdateData.length === 0) {
            const { data: staffUpdateData, error: staffError } = await supabase
                .from('staff')
                .update({ password: hashedPassword })
                .eq('id', decoded.id)
                .select('email');
            
            user = staffUpdateData?.[0];
            if (staffError) throw staffError;
        } else {
            if (error) throw error;
        }

        // Update Supabase Auth if email is available
        if (user && user.email) {
            await supabaseAuth.updatePassword(newPassword);
        }

        logger.info(`[RESET-COMPLETE] Password rotated for: ${decoded.id}`);
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        logger.error(`[RESET-COMPLETE] Error: ${error.message}`);
        res.status(401).json({ success: false, message: 'Invalid or expired reset token.' });
    }
};


export const loginAs = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) return res.status(400).json({ success: false, message: 'Token required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        
        if (decoded.scope !== 'user_only') {
            return res.status(403).json({ success: false, message: 'Invalid token scope' });
        }

        const supabase = configManager.getSupabaseClient();
        const { data: user } = await supabase.from('users').select('*').eq('id', decoded.id).single();

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

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
        res.status(401).json({ success: false, message: 'Token expired or invalid' });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        const oldToken = authHeader.split(' ')[1];
        const decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'secret', { ignoreExpiration: true });
        const expiredAt = decoded.exp * 1000;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - expiredAt > sevenDaysMs) {
            return res.status(401).json({ success: false, message: 'Refresh window expired.' });
        }
        const newToken = jwt.sign({ id: decoded.id, role: decoded.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        logger.info('[TOKEN-REFRESH] Rotated token for: ' + decoded.id);
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token refresh failed' });
    }
};

export const logout = async (req, res) => {
    try {
        logger.info('[LOGOUT] Server-side session invalidated for: ' + (req.user?.id || 'unknown'));
        res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'strict', secure: true });
        res.json({ success: true, message: 'Session invalidated' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const verifySession = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({ success: false, valid: false });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        res.json({ success: true, valid: true, user: { id: decoded.id, role: decoded.role } });
    } catch (error) {
        res.status(401).json({ success: false, valid: false, message: 'Token invalid or expired' });
    }
};

export default { signup, login, socialHandshake, forgotPassword, completeReset, loginAs, refreshToken, logout, verifySession };