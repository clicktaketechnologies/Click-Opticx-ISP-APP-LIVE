import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import supabaseAuth from '../modules/auth/supabase-auth.js';
import roleSync from '../modules/auth/role-sync.js';
import configManager from '../services/config-manager.js';
import { sendDirectEmail } from '../modules/email/resend-direct.js';
import argon2 from 'argon2';
import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Zod Validation Schemas
const signupSchema = z.object({
  name: z.string().min(1, "Full Name is required"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 characters long"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Identifier (email, username, or phone) is required"),
  password: z.string().min(1, "Password is required")
});

// Login attempts tracker (in-memory rate limiter)
const loginAttempts = new Map();

function trackLoginAttempt(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || [];
    const recentAttempts = attempts.filter(time => now - time < 15 * 60 * 1000);
    recentAttempts.push(now);
    loginAttempts.set(identifier, recentAttempts);
    return recentAttempts.length;
}

function clearLoginAttempts(identifier) {
    loginAttempts.delete(identifier);
}

function getLoginAttemptCount(identifier) {
    const now = Date.now();
    const attempts = loginAttempts.get(identifier) || [];
    return attempts.filter(time => now - time < 15 * 60 * 1000).length;
}

// Helper to determine if we should write to Firebase
const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

export const signup = async (req, res) => {
    try {
        logger.info(`[SIGNUP] Attempt for: ${req.body?.email || req.body?.username}`);
        
        // 1. Zod Validation
        const validation = signupSchema.safeParse(req.body);
        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return res.status(400).json({ 
                success: false, 
                error: 'VALIDATION_ERROR',
                field: firstError.path[0],
                message: firstError.message 
            });
        }

        const { name, username, email, phone, password, role = 'Customer', ...otherData } = req.body;
        const supabase = configManager.getSupabaseClient();
        
        // 2. Supabase Duplicate Check
        const orConditions = [];
        if (email) orConditions.push(`email.eq.${email}`);
        if (username) orConditions.push(`username.eq.${username.trim()}`);
        if (phone) orConditions.push(`phone.eq.${phone}`);
        
        if (orConditions.length > 0) {
            const { data: existingUser } = await supabase
                .from('users')
                .select('id, email, phone, username')
                .or(orConditions.join(','))
                .maybeSingle();

            if (existingUser) {
                let duplicateField = 'user';
                if (existingUser.email === email) duplicateField = 'email';
                else if (existingUser.username === username) duplicateField = 'username';
                else if (existingUser.phone === phone) duplicateField = 'phone';

                return res.status(400).json({ 
                    success: false, 
                    error: 'CONFLICT_ERROR',
                    field: duplicateField,
                    message: `An account already exists with this ${duplicateField}.` 
                });
            }
        }

        // 3. Supabase Auth Registration
        let supabaseUser;
        try {
            const authResult = await supabaseAuth.signUp({
                email,
                password,
                metadata: { name, username, phone, role: 'Customer' }
            });
            
            if (!authResult || !authResult.user) {
                throw new Error("Supabase Auth sign up did not return user details.");
            }
            supabaseUser = authResult.user;
        } catch (authError) {
            logger.error(`[SIGNUP] Supabase Auth failure: ${authError.message}`);
            if (authError.message && (authError.message.includes('already exists') || authError.code === 'user_already_exists')) {
                return res.status(400).json({
                    success: false,
                    error: 'CONFLICT_ERROR',
                    field: 'email',
                    message: 'An account with this email already exists in the identity provider.'
                });
            }
            throw authError;
        }

        const userId = supabaseUser.id; // Use UUID from Supabase Auth!

        // 4. Create local password hash
        const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

        // 5. Generate 6-digit OTP code & Hash it
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await argon2.hash(otpCode, { type: argon2.argon2id });

        const newUser = {
            id: userId,
            name: name,
            username: username,
            email: email,
            phone: phone,
            password: hashedPassword,
            role: 'Customer',
            status: 'PENDING_VERIFICATION',
            verification_status: 'Unverified',
            balance: 0,
            created_at: new Date().toISOString(),
            raw_data: {
                ...otherData,
                verificationCode: {
                    hash: hashedOtp,
                    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
                    verified: false
                },
                sessions: []
            }
        };

        // 6. Supabase Primary Write (Insert to public.users using UUID!)
        const { error: sbError } = await supabase.from('users').insert([newUser]);
        if (sbError) {
            logger.error(`[SIGNUP] Profile creation failure in public.users: ${sbError.message}`);
            // Rollback auth if profile insert fails to avoid orphaned records
            try {
                await supabase.auth.admin.deleteUser(userId);
            } catch (delErr) {
                logger.error(`[SIGNUP] Failed to rollback auth for ${userId}: ${delErr.message}`);
            }
            return res.status(400).json({ 
                success: false, 
                error: 'PROFILE_CREATION_FAILED', 
                message: 'Failed to initialize database profile: ' + sbError.message 
            });
        }

        // 7. Send Verification OTP Email (Resend API with 3× retry + Gmail SMTP fallback)
        if (email) {
            // Development Testability Hook — write OTP to file for local testing
            try {
                fs.writeFileSync(path.join(process.cwd(), 'latest_otp.txt'), otpCode);
                logger.info(`[TEST-HOOK] Wrote latest signup OTP ${otpCode} to latest_otp.txt`);
            } catch (e) {
                logger.warn(`[TEST-HOOK] Failed to write OTP file: ${e.message}`);
            }

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Welcome to Click Opticx!</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Thank you for signing up. Please enter the following 6-digit verification code to activate your account:</p>
                    <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 16px; background: #f1f5f9; display: inline-block; border-radius: 12px; margin: 16px 0; color: #000;">${otpCode}</div>
                    <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes.</p>
                </div>
            `;

            // Direct Resend API (3× exponential retry) → Gmail SMTP fallback
            const emailResult = await sendDirectEmail({
                to: email,
                subject: 'Verify Your Click Opticx Account',
                html: emailHtml,
                type: 'otp'
            });

            if (emailResult.success) {
                logger.info(`[SIGNUP] OTP email delivered | to=${email} | provider=${emailResult.provider} | msgId=${emailResult.messageId}`);
            } else {
                logger.error(`[SIGNUP] OTP email FAILED to deliver | to=${email} | error=${emailResult.error}`);
                // Registration still succeeds — user can request resend
            }
        }

        // 8. Firebase Mirror (Only if enabled)
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

        // 9. Write Audit Log
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            const { error: auditError } = await supabase.from('audit_logs').insert({
                id: crypto.randomUUID(),
                action: 'SIGNUP_PENDING',
                user_id: userId,
                user_name: name,
                details: `User registration initialized with Supabase Auth UUID. OTP code queued to ${email}.`,
                type: 'AUTH',
                ip_address: ip,
                metadata: { email, phone, timestamp: new Date().toISOString() }
            });
            if (auditError) {
                logger.error('[AUDIT-LOG] Failed to write SIGNUP_PENDING audit log:', auditError);
            }
        } catch (logErr) {
            logger.warn(`[AUDIT-LOG] Failed to write signup log: ${logErr.message}`);
        }

        res.status(201).json({ 
            success: true, 
            message: "Verification email sent. Check inbox.",
            userId,
            expiresAt: Date.now() + 10 * 60 * 1000
        });
    } catch (error) {
        logger.error(`[SIGNUP] Error: ${error.message}`, { stack: error.stack });
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message || 'Internal Server Error' });
    }
};

export const login = async (req, res) => {
    try {
        // 1. Zod Validation
        const validation = loginSchema.safeParse(req.body);
        if (!validation.success) {
            const firstError = validation.error.issues[0];
            return res.status(400).json({ 
                success: false, 
                error: 'VALIDATION_ERROR',
                field: firstError.path[0],
                message: firstError.message 
            });
        }

        const { identifier, password } = req.body;
        const supabase = configManager.getSupabaseClient();

        // 2. Rate Limiting Check
        const attempts = getLoginAttemptCount(identifier);
        if (attempts >= 5) {
            return res.status(429).json({ 
                success: false, 
                error: 'RATE_LIMITED', 
                message: 'Too many failed login attempts. Please try again in 15 minutes.' 
            });
        }

        // Admin hardcoded fallback
        const adminEmail = 'admin@clickopticx.com';
        const adminPass = 'Click@Opticx2026';
        if (identifier.toLowerCase() === adminEmail && password === adminPass) {
            const adminUser = {
                id: 'STAFF-ADMIN',
                name: 'System Administrator',
                email: adminEmail,
                role: 'SuperAdmin',
            };
            const token = jwt.sign({ id: adminUser.id, role: adminUser.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
            const refreshToken = crypto.randomUUID();

            res.cookie('accessToken', token, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

            return res.json({ success: true, token, user: adminUser });
        }

        // 3. User Lookup
        let { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
            .maybeSingle();

        // Staff Check if not in users
        if (!user || error) {
            const { data: staffUser } = await supabase
                .from('staff')
                .select('*')
                .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
                .maybeSingle();
            
            user = staffUser;
        }

        // User not found check
        if (!user) {
            trackLoginAttempt(identifier);
            return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid username, email, phone or password.' });
        }

        // 4. Authenticate via Supabase Auth (Single Source of Truth)
        let authSession;
        try {
            const authResult = await supabaseAuth.signIn({
                email: user.email,
                password
            });
            authSession = authResult;
        } catch (authError) {
            trackLoginAttempt(identifier);
            logger.warn(`[LOGIN] Supabase Auth authentication failed for ${user.email}: ${authError.message}`);
            
            const errMsg = authError.message ? authError.message.toLowerCase() : '';
            if (errMsg.includes('confirm') || errMsg.includes('verified') || authError.code === 'email_not_confirmed') {
                return res.status(403).json({ 
                    success: false, 
                    error: 'ACCOUNT_NOT_VERIFIED', 
                    message: 'Please verify your email first.',
                    status: 'PENDING_VERIFICATION',
                    userId: user.id
                });
            }
            
            return res.status(401).json({ 
                success: false, 
                error: 'INVALID_CREDENTIALS', 
                message: 'Invalid username, email, phone or password.' 
            });
        }

        // 5. Account Status Enforcement
        const BLOCKED_STATUSES = ['PENDING_VERIFICATION', 'SUSPENDED', 'Locked', 'Disabled', 'Blocked'];
        if (user.status === 'PENDING_VERIFICATION') {
            return res.status(403).json({ 
                success: false, 
                error: 'ACCOUNT_NOT_VERIFIED', 
                message: 'Account not verified. Please complete verification first.',
                status: 'PENDING_VERIFICATION',
                userId: user.id
            });
        }

        if (user.status === 'SUSPENDED' || user.status === 'Locked') {
            return res.status(403).json({ 
                success: false, 
                error: 'ACCOUNT_SUSPENDED',
                message: `Account is ${user.status}. Please contact support.` 
            });
        }

        // Block explicitly disabled/blocked accounts, but allow all ISP active variants
        // (e.g. 'Active', 'Active - Payment Due', 'Emergency Active', 'Grace Period Active', etc.)
        const isActiveVariant = user.status && (
            user.status.toLowerCase().startsWith('active') ||
            user.status.toLowerCase().includes('active') ||
            user.status === 'Recovery Mode Active' ||
            user.status === 'No Active Plan' // allow login even with no plan
        );
        if (!isActiveVariant && BLOCKED_STATUSES.includes(user.status)) {
            return res.status(403).json({ 
                success: false, 
                error: 'INACTIVE_ACCOUNT',
                message: `Account status is "${user.status}". Access blocked.` 
            });
        }

        // Clear failed attempts on success
        clearLoginAttempts(identifier);

        // 6. Double Cookies + IP & Fingerprint Bindings
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '15m' }
        );

        const refreshToken = crypto.randomUUID();
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
        const fingerprint = req.headers['x-device-fingerprint'] || req.body.fingerprint || 'unknown';

        // Update sessions array in database (retires old expired sessions)
        const updatedRawData = { ...(user.raw_data || {}) };
        const activeSessions = (updatedRawData.sessions || []).filter(s => new Date(s.expiresAt).getTime() > Date.now());
        
        activeSessions.push({
            refreshToken,
            ipHash,
            fingerprint,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });
        
        updatedRawData.sessions = activeSessions;
        
        const targetTable = (user.role && user.role !== 'Customer') ? 'staff' : 'users';
        await supabase.from(targetTable).update({ raw_data: updatedRawData }).eq('id', user.id);

        // Emit cookies
        res.cookie('accessToken', token, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 });

        // Audit Log
        try {
            const { error: auditError } = await supabase.from('audit_logs').insert({
                id: crypto.randomUUID(),
                action: 'LOGIN_SUCCESS',
                user_id: user.id,
                user_name: user.name,
                admin_id: null,
                admin_name: null,
                details: 'User logged in successfully.',
                type: 'AUTH',
                ip_address: ip,
                metadata: { email: user.email, role: user.role, fingerprint, timestamp: new Date().toISOString() }
            });
            if (auditError) {
                logger.error('[AUDIT-LOG] Failed to write LOGIN_SUCCESS audit log:', auditError);
            }
        } catch (logErr) {
            logger.warn(`[AUDIT-LOG] Failed to write login log: ${logErr.message}`);
        }

        res.json({ success: true, token, user });
    } catch (error) {
        logger.error(`[LOGIN] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const verifyOtp = async (req, res) => {
    try {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            return res.status(400).json({ 
                success: false, 
                error: 'VALIDATION_ERROR', 
                message: 'User ID and OTP code are required.' 
            });
        }

        const supabase = configManager.getSupabaseClient();
        const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();

        if (error || !user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found.' });
        }

        const verificationCode = user.raw_data?.verificationCode;
        if (!verificationCode || !verificationCode.hash || !verificationCode.expiresAt) {
            return res.status(400).json({ success: false, error: 'VERIFICATION_FAILED', message: 'No active verification code found.' });
        }

        // Check expiration
        if (new Date(verificationCode.expiresAt).getTime() < Date.now()) {
            return res.status(400).json({ success: false, error: 'VERIFICATION_EXPIRED', message: 'Verification code has expired. Please request a new one.' });
        }

        // Verify OTP code hash
        const isMatch = await argon2.verify(verificationCode.hash, otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'INVALID_OTP', message: 'Invalid verification code. Please check again.' });
        }

        // Update database
        const updatedRawData = { ...user.raw_data };
        if (updatedRawData.verificationCode) {
            updatedRawData.verificationCode.verified = true;
        }

        const { error: updateError } = await supabase
            .from('users')
            .update({ 
                status: 'Active', 
                verification_status: 'Verified',
                raw_data: updatedRawData 
            })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Log audit
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            await supabase.from('audit_logs').insert({
                id: crypto.randomUUID(),
                action: 'VERIFY_OTP_SUCCESS',
                user_id: userId,
                user_name: user.name,
                details: 'OTP verified successfully. User status set to Active.',
                type: 'AUTH',
                ip_address: ip,
                metadata: { timestamp: new Date().toISOString() }
            });
        } catch (logErr) {
            logger.warn(`[AUDIT-LOG] Failed to write verification log: ${logErr.message}`);
        }

        res.json({ success: true, status: 'VERIFIED', message: 'Account successfully verified. You can now login.' });
    } catch (err) {
        logger.error(`[VERIFY-OTP] Error: ${err.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' });
    }
};

export const socialHandshake = async (req, res) => {
    try {
        const { email, phone, name, provider } = req.body;
        const supabase = configManager.getSupabaseClient();
        
        logger.info(`[SOCIAL-HANDSHAKE] Verification for: ${email || phone} via ${provider}`);
        
        let { data: user } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${email},phone.eq.${phone}`)
            .maybeSingle();

        if (!user) {
            const userId = crypto.randomUUID();
            user = {
                id: userId,
                name,
                email,
                phone,
                role: 'Customer',
                status: 'Active',
                verification_status: 'Verified',
                balance: 0,
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
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const supabase = configManager.getSupabaseClient();

        // Check if user exists in public.users or staff
        let { data: user } = await supabase.from('users').select('id, name').eq('email', email).maybeSingle();
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('id, name').eq('email', email).maybeSingle();
            user = staffUser;
        }

        if (user) {
            // Generate link manually to allow custom SMTP fallback (guaranteed delivery)
            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'recovery',
                email: email,
                options: {
                    redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                }
            });

            if (linkError) {
                logger.error(`[FORGOT-PASSWORD] Generate link failed: ${linkError.message}`);
                // fallback to default reset
                await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                });
                logger.info(`[FORGOT-PASSWORD] Password reset Magic Link dispatched via Supabase to ${email}`);
            } else {
                const actionLink = linkData.properties.action_link;
                // Send email manually
                const emailHtml = `
                    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                        <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Click the button below to reset your password:</p>
                        <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                        <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                    </div>
                `;

                // Send via Resend (3× retry) → Gmail SMTP fallback
                const resetEmailResult = await sendDirectEmail({
                    to: email,
                    subject: 'Reset Your Click Opticx Password',
                    html: emailHtml,
                    type: 'password_reset'
                });

                if (resetEmailResult.success) {
                    logger.info(`[FORGOT-PASSWORD] Reset email delivered | to=${email} | provider=${resetEmailResult.provider} | msgId=${resetEmailResult.messageId}`);
                } else {
                    logger.error(`[FORGOT-PASSWORD] Reset email failed | to=${email} | error=${resetEmailResult.error}`);
                    // Final fallback: Supabase built-in delivery
                    await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                    });
                    logger.info(`[FORGOT-PASSWORD] Supabase fallback reset dispatched to ${email}`);
                }
            }
        }

        res.json({ success: true, message: 'If an account exists with this email, a reset link has been sent.' });
    } catch (error) {
        logger.error(`[FORGOT-PASSWORD] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const completeReset = async (req, res) => {
    try {
        const { token, newPassword, userId } = req.body;
        const supabase = configManager.getSupabaseClient();

        let targetId = userId;

        // If legacy token is provided, decode it to get user ID
        if (token && token !== 'BIOMETRIC_APPROVED' && token !== 'SUPABASE_RECOVERY') {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                targetId = decoded.id;
            } catch (err) {
                // Ignore and fallback to userId
            }
        }

        if (!targetId) {
            return res.status(400).json({ success: false, error: 'USER_ID_REQUIRED', message: 'Identity context missing.' });
        }

        const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

        let { data: userUpdateData, error } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', targetId)
            .select('email');

        let user = userUpdateData?.[0];

        if (!user || userUpdateData.length === 0) {
            const { data: staffUpdateData, error: staffError } = await supabase
                .from('staff')
                .update({ password: hashedPassword })
                .eq('id', targetId)
                .select('email');
            
            user = staffUpdateData?.[0];
            if (staffError) throw staffError;
        } else {
            if (error) throw error;
        }

        logger.info(`[RESET-COMPLETE] Password rotated locally for user: ${targetId}`);
        res.json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        logger.error(`[RESET-COMPLETE] Error: ${error.message}`);
        res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' });
    }
};

export const loginAs = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, error: 'TOKEN_REQUIRED', message: 'Token required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.scope !== 'user_only') {
            return res.status(403).json({ success: false, error: 'INVALID_SCOPE', message: 'Invalid token scope' });
        }

        const supabase = configManager.getSupabaseClient();
        const { data: user } = await supabase.from('users').select('*').eq('id', decoded.id).maybeSingle();

        if (!user) return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });

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
        res.status(401).json({ success: false, error: 'TOKEN_INVALID', message: 'Token expired or invalid' });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const cookieHeader = req.headers.cookie;
        const cookies = {};
        if (cookieHeader) {
            cookieHeader.split(';').forEach(cookie => {
                let parts = cookie.split('=');
                cookies[parts.shift().trim()] = decodeURI(parts.join('='));
            });
        }

        let refToken = cookies.refreshToken || cookies.refresh_token;
        if (!refToken) {
            return res.status(401).json({ success: false, error: 'NO_REFRESH_TOKEN', message: 'No refresh token provided.' });
        }

        const supabase = configManager.getSupabaseClient();
        
        let userId = req.body.userId;
        if (!userId) {
            const authHeader = req.headers.authorization;
            let oldToken = cookies.accessToken || cookies.access_token;
            if (!oldToken && authHeader && authHeader.startsWith('Bearer')) {
                oldToken = authHeader.split(' ')[1];
            }
            if (oldToken) {
                try {
                    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'secret', { ignoreExpiration: true });
                    userId = decoded.id;
                } catch (e) {
                    // ignore
                }
            }
        }

        if (!userId) {
            return res.status(401).json({ success: false, error: 'INVALID_REFRESH_HANDSHAKE', message: 'Cannot verify identity from expired session.' });
        }

        let { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('*').eq('id', userId).maybeSingle();
            user = staffUser;
        }

        if (!user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });
        }

        const sessions = user.raw_data?.sessions || [];
        const sessionIndex = sessions.findIndex(s => s.refreshToken === refToken);

        if (sessionIndex === -1) {
            return res.status(401).json({ success: false, error: 'SESSION_EXPIRED', message: 'Refresh session expired or invalid.' });
        }

        const session = sessions[sessionIndex];
        if (new Date(session.expiresAt).getTime() < Date.now()) {
            sessions.splice(sessionIndex, 1);
            const targetTable = (user.role && user.role !== 'Customer') ? 'staff' : 'users';
            await supabase.from(targetTable).update({ raw_data: { ...user.raw_data, sessions } }).eq('id', userId);
            return res.status(401).json({ success: false, error: 'SESSION_EXPIRED', message: 'Refresh session expired.' });
        }

        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
        const fingerprint = req.headers['x-device-fingerprint'] || req.body.fingerprint || 'unknown';

        if (session.ipHash !== ipHash || session.fingerprint !== fingerprint) {
            res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
            res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });
            return res.status(403).json({ success: false, error: 'DEVICE_MISMATCH', message: 'Session binding violation. Device/IP mismatch detected during token refresh.' });
        }

        const newToken = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
        res.cookie('accessToken', newToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 });

        logger.info('[TOKEN-REFRESH] Rotated access token via httpOnly cookie for: ' + user.id);
        res.json({ success: true, token: newToken });
    } catch (error) {
        res.status(401).json({ success: false, error: 'REFRESH_FAILED', message: 'Token refresh failed: ' + error.message });
    }
};

export const logout = async (req, res) => {
    try {
        logger.info('[LOGOUT] Server-side session invalidated for: ' + (req.user?.id || 'unknown'));
        res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
        res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });
        res.json({ success: true, message: 'Session invalidated' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, error: 'TOKEN_REQUIRED', message: 'Verification token required' });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        if (decoded.type !== 'email_verification') throw new Error('Invalid token type');

        const supabase = configManager.getSupabaseClient();
        
        const { error } = await supabase
            .from('users')
            .update({ status: 'Active', verification_status: 'Verified' })
            .eq('id', decoded.id);

        if (error) throw error;

        logger.info(`[VERIFY-EMAIL] User ${decoded.id} activated.`);
        res.json({ success: true, message: 'Account successfully verified. You can now login.' });
    } catch (error) {
        logger.error(`[VERIFY-EMAIL] Error: ${error.message}`);
        res.status(400).json({ success: false, error: 'VERIFICATION_FAILED', message: 'Invalid or expired verification link.' });
    }
};

export const checkVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.query;
        const supabase = configManager.getSupabaseClient();
        const { data: user } = await supabase.from('users').select('status').eq('id', userId).maybeSingle();
        
        res.json({ success: true, status: user?.status || 'NotFound' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};


export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'NOT_AUTHENTICATED', message: 'Not authenticated' });
        }

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ success: false, error: 'MISSING_FIELDS', message: 'Old and new passwords are required' });
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ success: false, error: 'WEAK_NEW_PASSWORD', message: 'Password must be at least 8 characters, and contain at least one uppercase letter, one number, and one symbol.' });
        }

        const supabase = configManager.getSupabaseClient();
        
        // Find user
        let userTable = 'users';
        let { data: user } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
        if (!user) {
            userTable = 'staff';
            const { data: staffUser } = await supabase.from('staff').select('*').eq('id', userId).maybeSingle();
            user = staffUser;
        }

        if (!user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });
        }

        // Verify old password
        const passwordMatches = await argon2.verify(user.password, oldPassword);
        if (!passwordMatches) {
            return res.status(400).json({ success: false, error: 'INVALID_OLD_PASSWORD', message: 'The old password you entered is incorrect.' });
        }

        // Hash new password
        const hashedPassword = await argon2.hash(newPassword, { type: argon2.argon2id });

        // Update password and revoke all sessions
        const updatedRawData = {
            ...user.raw_data,
            sessions: []
        };

        const { error } = await supabase.from(userTable).update({
            password: hashedPassword,
            raw_data: updatedRawData
        }).eq('id', userId);

        if (error) {
            return res.status(500).json({ success: false, error: 'NETWORK_ERROR', message: 'Database update failed' });
        }

        // Write Audit Log
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            await supabase.from('audit_logs').insert({
                id: crypto.randomUUID(),
                action: 'PASSWORD_CHANGED',
                user_id: userId,
                user_name: user.name,
                details: 'User password changed successfully. Other sessions revoked.',
                type: 'SECURITY',
                ip_address: ip,
                created_at: new Date().toISOString()
            });
        } catch (auditErr) {
            logger.error('[AUDIT-LOG] Failed to write password change audit log:', auditErr);
        }

        res.json({ success: true, message: 'Password updated successfully. Please re-login.' });
    } catch (error) {
        logger.error(`[CHANGE-PASSWORD] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'NETWORK_ERROR', message: error.message });
    }
};

export const verifySession = async (req, res) => {
    try {
        const cookieHeader = req.headers.cookie;
        const cookies = {};
        if (cookieHeader) {
            cookieHeader.split(';').forEach(cookie => {
                let parts = cookie.split('=');
                cookies[parts.shift().trim()] = decodeURI(parts.join('='));
            });
        }

        let token = cookies.accessToken || cookies.access_token;
        const authHeader = req.headers.authorization;
        if (!token && authHeader && authHeader.startsWith('Bearer')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'NOT_AUTHENTICATED', message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        
        const supabase = configManager.getSupabaseClient();
        let { data: user } = await supabase.from('users').select('*').eq('id', decoded.id).maybeSingle();
        
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('*').eq('id', decoded.id).maybeSingle();
            user = staffUser;
        }

        if (!user) return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });

        // Session Binding Security Verification
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
        const fingerprint = req.headers['x-device-fingerprint'] || req.body.fingerprint || 'unknown';

        if (user.raw_data?.sessions && user.raw_data.sessions.length > 0) {
            const activeSessions = user.raw_data.sessions.filter(s => new Date(s.expiresAt).getTime() > Date.now());
            const currentSession = activeSessions.find(s => s.fingerprint === fingerprint);
            if (!currentSession || currentSession.ipHash !== ipHash) {
                res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
                res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });
                return res.status(403).json({ success: false, error: 'DEVICE_MISMATCH', message: 'Session binding violation. Device/IP mismatch or unregistered device signature detected.' });
            }
        }

        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, error: 'INVALID_SESSION', message: 'Invalid session' });
    }
};

export default { signup, login, socialHandshake, forgotPassword, completeReset, loginAs, refreshToken, logout, verifySession, verifyEmail, checkVerificationStatus, verifyOtp, changePassword };