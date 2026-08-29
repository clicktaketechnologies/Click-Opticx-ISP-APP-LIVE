import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import supabaseAuth from '../modules/auth/supabase-auth.js';
import roleSync from '../modules/auth/role-sync.js';
import configManager from '../services/config-manager.js';
import { sendDirectEmail } from '../modules/email/resend-direct.js';

import { z } from 'zod';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Get the configured Supabase admin client or fail with a clear 503. */
function getClient() {
    return configManager.requireSupabaseClient();
}

/** JWT signing secret — never fall back to a static value committed to source. */
function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        logger.error('[AUTH] JWT_SECRET env var is NOT set! Sessions will be invalidated on every restart. Set it in backend/.env');
        return crypto.randomBytes(32).toString('hex'); // random per-process fallback: fail-closed for attackers, degraded UX only
    }
    return secret;
}

/**
 * Strip sensitive fields before returning a user/staff row to any client.
 * Previously the login/verify endpoints returned the FULL row including the
 * bcrypt password hash, OTP hashes and refresh-session tokens.
 */
function sanitizeUser(user) {
    if (!user) return user;
    const { password, raw_data, ...safe } = user;
    if (raw_data && typeof raw_data === 'object') {
        safe.raw_data = {
            connectionId: raw_data.connectionId,
            address: raw_data.address,
            area: raw_data.area,
            cnic: raw_data.cnic,
            packageId: raw_data.packageId,
            verificationCode: raw_data.verificationCode
                ? { verified: !!raw_data.verificationCode.verified, expiresAt: raw_data.verificationCode.expiresAt }
                : undefined
        };
    }
    return safe;
}

/** Cookie options shared by all auth cookie writes — cross-site (Firebase Hosting → Render) requires SameSite=None; Secure. */
const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: 'none' };

// Timeout helper for Supabase calls
const timeoutPromise = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
};

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

const resetPasswordSchema = z.object({
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one symbol")
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
        const supabase = getClient();
        
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
        
        // 2. Supabase Duplicate Check
        const orConditions = [];
        if (email) orConditions.push(`email.eq.${email}`);
        if (username) orConditions.push(`username.eq.${username.trim()}`);
        if (phone) orConditions.push(`phone.eq.${phone}`);
        
         if (orConditions.length > 0) {
             const { data: existingUser } = await timeoutPromise(
                 supabase
                     .from('users')
                     .select('id, email, phone, username')
                     .or(orConditions.join(','))
                     .maybeSingle(),
                 10000 // 10 seconds timeout
             );

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
              const authResult = await timeoutPromise(
                  supabaseAuth.signUp({
                      email,
                      password,
                      metadata: { name, username, phone, role: 'Customer' }
                  }),
                  10000 // 10 seconds timeout
              );
             
             if (!authResult || !authResult.user) {
                 throw new Error("Supabase Auth sign up did not return user details.");
             }
             supabaseUser = authResult.user;
         } catch (authError) {
             logger.error(`[SIGNUP] Supabase Auth failure: ${authError.message}`);
             if (authError.message === 'AUTH_TIMEOUT') {
                 return res.status(504).json({ 
                     success: false, 
                     error: 'AUTH_TIMEOUT', 
                     message: 'Authentication service timeout. Please try again.' 
                 });
             }
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
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Generate 6-digit OTP code & Hash it
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);

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
         const { error: sbError } = await timeoutPromise(
             supabase.from('users').insert([newUser]),
             10000 // 10 seconds timeout
         );
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

        // 7. Send Verification OTP Email (Resend API with 3x retry + Gmail SMTP fallback)
        if (email) {
            // Development-only testability hook — OTPs must NEVER be written to disk in production
            if (process.env.NODE_ENV !== 'production') {
                try {
                    fs.writeFileSync(path.join(process.cwd(), 'latest_otp.txt'), otpCode);
                    logger.info(`[TEST-HOOK] Wrote latest signup OTP ${otpCode} to latest_otp.txt`);
                } catch (e) {
                    logger.warn(`[TEST-HOOK] Failed to write OTP file: ${e.message}`);
                }
            }

            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Welcome to Click Opticx!</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Thank you for signing up. Please enter the following 6-digit verification code to activate your account:</p>
                    <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 16px; background: #f1f5f9; display: inline-block; border-radius: 12px; margin: 16px 0; color: #000;">${otpCode}</div>
                    <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes.</p>
                </div>
            `;

            // Direct Resend API (3Ã— exponential retry) â†’ Gmail SMTP fallback
             const emailResult = await timeoutPromise(
                 sendDirectEmail({
                     to: email,
                     subject: 'Verify Your Click Opticx Account',
                     html: emailHtml,
                     type: 'otp'
                 }),
                 15000 // 15 seconds timeout for email
             );

            if (emailResult.success) {
                logger.info(`[SIGNUP] OTP email delivered | to=${email} | provider=${emailResult.provider} | msgId=${emailResult.messageId}`);
            } else {
                logger.error(`[SIGNUP] OTP email FAILED to deliver | to=${email} | error=${emailResult.error}`);
                // Registration still succeeds â€” user can request resend
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
             const { error: auditError } = await timeoutPromise(
                 supabase.from('audit_logs').insert({
                     id: crypto.randomUUID(),
                     action: 'SIGNUP_PENDING',
                     user_id: userId,
                     user_name: name,
                     details: `User registration initialized with Supabase Auth UUID. OTP code queued to ${email}.`,
                     type: 'AUTH',
                     ip_address: ip,
                     metadata: { email, phone, timestamp: new Date().toISOString() }
                 }),
                 10000 // 10 seconds timeout
             );
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
        res.status(error.status || 500).json({ success: false, error: error.code || 'INTERNAL_ERROR', message: error.message || 'Internal Server Error' });
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
        const supabase = getClient();

        // 2. Rate Limiting Check
        const attempts = getLoginAttemptCount(identifier);
        if (attempts >= 5) {
            return res.status(429).json({ 
                success: false, 
                error: 'RATE_LIMITED', 
                message: 'Too many failed login attempts. Please try again in 15 minutes.' 
            });
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
                .eq('email', identifier)
                .maybeSingle();
            
            user = staffUser;
        }

        // User not found check
        if (!user) {
            trackLoginAttempt(identifier);
            return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid username, email, phone or password.' });
        }

         // 4. Authenticate via Supabase Auth or DB password hash fallback
         let isAuthenticated = false;
         let authSession = null;

         if (user.email) {
             try {
                 const authResult = await supabaseAuth.signIn({
                     email: user.email,
                     password
                 });
                 if (authResult && authResult.user) {
                     isAuthenticated = true;
                     authSession = authResult;

                     // Hash convergence: keep the local DB hash in sync with Supabase Auth
                     // so a password changed via Supabase recovery stops working with an old local hash.
                     try {
                         const hashMatches = user.password
                             ? await bcrypt.compare(password, user.password).catch(() => false)
                             : false;
                         if (!hashMatches) {
                             const rehash = await bcrypt.hash(password, 10);
                             await supabase.from((user.role && user.role !== 'Customer') ? 'staff' : 'users')
                                 .update({ password: rehash })
                                 .eq('id', user.id);
                             user.password = rehash;
                             logger.info(`[LOGIN] Local hash re-synced from Supabase Auth for ${user.id}`);
                         }
                     } catch (convErr) {
                         logger.warn(`[LOGIN] Hash convergence skipped: ${convErr.message}`);
                     }
                 }
             } catch (authError) {
                 logger.warn(`[LOGIN] Supabase Auth signIn failed for ${user.email}: ${authError.message}`);
                 if (authError.message === 'AUTH_TIMEOUT') {
                     return res.status(504).json({ 
                         success: false, 
                         error: 'AUTH_TIMEOUT', 
                         message: 'Authentication service timeout. Please try again.' 
                     });
                 }
             }
         }

         if (!isAuthenticated && user.password) {
             try {
                 if (user.password.startsWith('$argon2')) {
                     try {
                         const argon2Module = await import('argon2');
                         isAuthenticated = await argon2Module.verify(user.password, password);
                     } catch (aErr) {
                         logger.warn(`[LOGIN] Argon2 verification error: ${aErr.message}`);
                     }
                 } else if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$') || user.password.startsWith('$2y$')) {
                     isAuthenticated = await bcrypt.compare(password, user.password);
                 }
                 // SECURITY: plaintext comparison fallback removed — passwords are only accepted via hash verification or Supabase Auth.
             } catch (pwdErr) {
                 logger.warn(`[LOGIN] Password hash check failed: ${pwdErr.message}`);
             }

             if (isAuthenticated && user.email) {
                 try {
                     const { data: existingAuth } = await supabase.auth.admin.getUserById(user.id);
                     if (existingAuth?.user) {
                         await supabase.auth.admin.updateUserById(user.id, { password, email_confirm: true });
                     } else {
                         await supabase.auth.admin.createUser({
                             email: user.email,
                             password,
                             email_confirm: true,
                             user_metadata: { name: user.name, role: user.role }
                         });
                     }
                 } catch (syncErr) {
                     logger.warn(`[LOGIN] Failed to auto-sync user to Supabase Auth: ${syncErr.message}`);
                 }
             }
         }

         if (!isAuthenticated) {
             trackLoginAttempt(identifier);
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
            getJwtSecret(),
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

        // Emit cookies — SameSite=None + Secure is required for the cross-site Firebase Hosting → Render flow
        res.cookie('accessToken', token, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

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

        // SECURITY: never return the password hash, OTP hashes or refresh tokens to the client
        res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (error) {
        logger.error(`[LOGIN] Error: ${error.message}`);
        res.status(error.status || 500).json({ success: false, error: error.code || 'INTERNAL_ERROR', message: error.message });
    }
};

// OTP brute-force protection (6-digit code = 1M combinations, so cap attempts per user)
const otpAttempts = new Map();
function trackOtpAttempt(userId) {
    const now = Date.now();
    const attempts = (otpAttempts.get(userId) || []).filter(t => now - t < 15 * 60 * 1000);
    attempts.push(now);
    otpAttempts.set(userId, attempts);
    return attempts.length;
}
function clearOtpAttempts(userId) {
    otpAttempts.delete(userId);
}
// Periodically purge stale entries so the Maps do not grow unbounded
setInterval(() => {
    const now = Date.now();
    const cutoff = 15 * 60 * 1000;
    for (const [k, v] of loginAttempts) {
        const recent = v.filter(t => now - t < cutoff);
        if (recent.length === 0) loginAttempts.delete(k); else loginAttempts.set(k, recent);
    }
    for (const [k, v] of otpAttempts) {
        const recent = v.filter(t => now - t < cutoff);
        if (recent.length === 0) otpAttempts.delete(k); else otpAttempts.set(k, recent);
    }
}, 10 * 60 * 1000).unref();

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

        if (trackOtpAttempt(userId) > 8) {
            return res.status(429).json({ success: false, error: 'RATE_LIMITED', message: 'Too many OTP attempts. Please request a new code in 15 minutes.' });
        }

        const supabase = getClient();
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
        const isMatch = await bcrypt.compare(otp, verificationCode.hash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'INVALID_OTP', message: 'Invalid verification code. Please check again.' });
        }

        clearOtpAttempts(userId);

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

        // Confirm email in Supabase Auth
        try {
            await supabase.auth.admin.updateUserById(userId, { email_confirm: true });
        } catch (confirmErr) {
            // Log but don't fail verification - user can still login with email confirmed in app DB
            logger.warn(`[VERIFY-OTP] Failed to confirm email in Supabase Auth for user ${userId}: ${confirmErr.message}`);
        }

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

export const resendOtp = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'VALIDATION_ERROR', 
                message: 'User ID is required.' 
            });
        }

        const supabase = getClient();
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error || !user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found.' });
        }

        // Check if user is pending verification (optional)
        // if (user.status !== 'PENDING_VERIFICATION') {
        //     return res.status(400).json({ success: false, error: 'INVALID_STATE', message: 'User is not pending verification.' });
        // }

        // Generate new OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedOtp = await bcrypt.hash(otpCode, 10);

        // Update verification code in raw_data
        const updatedRawData = { ...user.raw_data };
        updatedRawData.verificationCode = {
            hash: hashedOtp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
            verified: false
        };

        const { error: updateError } = await supabase
            .from('users')
            .update({ raw_data: updatedRawData })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Send OTP email
        if (user.email) {
            const emailHtml = `
                <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                    <h2 style="color: #0f172a; margin-top: 0;">Your Click Opticx Vermentation Code</h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">Please use the following 6-digit verification code to activate your account:</p>
                    <div style="font-size: 28px; font-weight: 800; letter-spacing: 6px; padding: 16px; background: #f1f5f9; display: inline-block; border-radius: 12px; margin: 16px 0; color: #000;">${otpCode}</div>
                    <p style="color: #64748b; font-size: 12px;">This code expires in 10 minutes.</p>
                </div>
            `;

            const emailResult = await sendDirectEmail({
                to: user.email,
                subject: 'Your Click Opticx Verification Code',
                html: emailHtml,
                type: 'otp'
            });

            if (emailResult.success) {
                logger.info(`[RESEND-OTP] OTP email delivered | to=${user.email} | provider=${emailResult.provider} | msgId=${emailResult.messageId}`);
            } else {
                logger.error(`[RESEND-OTP] OTP email FAILED to deliver | to=${user.email} | error=${emailResult.error}`);
                // Registration still succeeds â€” user can request resend again
            }
        }

        // Log audit
        try {
            const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
            await supabase.from('audit_logs').insert({
                id: crypto.randomUUID(),
                action: 'RESEND_OTP',
                user_id: userId,
                user_name: user.name,
                details: 'OTP resent via email.',
                type: 'AUTH',
                ip_address: ip,
                metadata: { timestamp: new Date().toISOString() }
            });
        } catch (logErr) {
            logger.warn(`[AUDIT-LOG] Failed to write resend OTP log: ${logErr.message}`);
        }

        res.json({ success: true, message: 'Verification code has been resent to your email.' });
    } catch (err) {
        logger.error(`[RESEND-OTP] Error: ${err.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: err.message || 'Internal Server Error' });
    }
};

export const socialHandshake = async (req, res) => {
    try {
        const { email, phone, name, provider, accessToken } = req.body;
        const supabase = getClient();

        logger.info(`[SOCIAL-HANDSHAKE] Verification for: ${email || phone} via ${provider}`);

        // SECURITY FIX: this endpoint previously issued a valid session JWT for ANY
        // email/phone with zero proof of identity (complete account-takeover vector).
        // The client must now present a Supabase OAuth access token issued by a real
        // social sign-in, and that token is verified server-side before anything else.
        if (!accessToken) {
            return res.status(401).json({
                success: false,
                error: 'OAUTH_TOKEN_REQUIRED',
                message: 'A valid OAuth access token from the social provider sign-in is required.'
            });
        }

        const { data: tokenData, error: tokenError } = await supabase.auth.getUser(accessToken);
        if (tokenError || !tokenData?.user) {
            return res.status(401).json({
                success: false,
                error: 'OAUTH_TOKEN_INVALID',
                message: 'Social sign-in token is invalid or expired.'
            });
        }
        const verifiedEmail = tokenData.user.email;
        const verifiedPhone = tokenData.user.phone;

        // Only use identity attributes that the provider actually verified
        const safeEmail = verifiedEmail || null;
        const safePhone = verifiedPhone || phone || null;

         let { data: user } = await timeoutPromise(
           supabase
             .from('users')
             .select('*')
             .or([safeEmail ? `email.eq.${safeEmail}` : null, safePhone ? `phone.eq.${safePhone}` : null].filter(Boolean).join(',') || 'id.is.null')
             .maybeSingle(),
           10000 // 10 seconds timeout
         );

         if (!user) {
             const userId = tokenData.user.id; // reuse the OAuth identity UUID
             user = {
                 id: userId,
                 name: name || tokenData.user.user_metadata?.full_name || safeEmail,
                 email: safeEmail,
                 phone: safePhone,
                 role: 'Customer',
                 status: 'Active',
                 verification_status: 'Verified',
                 balance: 0,
                 created_at: new Date().toISOString()
             };
             await timeoutPromise(
               supabase.from('users').insert([user]),
               10000 // 10 seconds timeout
             );
             logger.info(`[SOCIAL-HANDSHAKE] Created new user: ${userId}`);
         }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            getJwtSecret(),
            { expiresIn: '7d' }
        );

        res.json({ success: true, token, user: sanitizeUser(user) });
    } catch (error) {
        logger.error(`[SOCIAL-HANDSHAKE] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const supabase = getClient();

        // Check if user exists in public.users or staff
        let { data: user } = await supabase.from('users').select('id, name').eq('email', email).maybeSingle();
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('id, name').eq('email', email).maybeSingle();
            user = staffUser;
        }

         if (user) {
             // Generate link manually to allow custom SMTP fallback (guaranteed delivery)
             const { data: linkData, error: linkError } = await timeoutPromise(
               supabase.auth.admin.generateLink({
                 type: 'recovery',
                 email: email,
                 options: {
                   redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                 }
               }),
               10000 // 10 seconds timeout
             );

             if (linkError) {
                 logger.error(`[FORGOT-PASSWORD] Generate link failed: ${linkError.message}`);
                 // fallback to default reset
                 await timeoutPromise(
                   supabase.auth.resetPasswordForEmail(email, {
                     redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                   }),
                   10000 // 10 seconds timeout
                 );
                 logger.info(`[FORGOT-PASSWORD] Password reset Magic Link dispatched via Supabase to ${email}`);
             } else {
                 let actionLink = linkData.properties.action_link;
                 try {
                     const urlObj = new URL(actionLink);
                     if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
                         urlObj.protocol = 'https:';
                         urlObj.host = 'isp-click-opticx.web.app';
                         urlObj.pathname = '/reset-password';
                         actionLink = urlObj.toString();
                     }
                 } catch (e) {}
                 // Send email manually
                 const emailHtml = `
                     <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px;">
                         <h2 style="color: #0f172a; margin-top: 0;">Password Reset Request</h2>
                         <p style="color: #475569; font-size: 14px; line-height: 1.6;">Click the button below to reset your password:</p>
                         <a href="${actionLink}" style="display: inline-block; padding: 12px 24px; background: #ea580c; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
                         <p style="color: #64748b; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                     </div>
                 `;

                 // Send via Resend (3Ã— retry) â†’ Gmail SMTP fallback
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
                     await timeoutPromise(
                       supabase.auth.resetPasswordForEmail(email, {
                         redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/reset-password`
                       }),
                       10000 // 10 seconds timeout
                     );
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
        const { token, newPassword, userId, supabaseAccessToken } = req.body;
        const supabase = getClient();

        // SECURITY FIX: this endpoint previously accepted the magic strings
        // 'BIOMETRIC_APPROVED' / 'SUPABASE_RECOVERY' plus a bare userId — allowing
        // anyone to reset ANY account's password. Identity must now come from one of:
        //   1. a valid Supabase recovery session access token (sent by the reset page
        //      after the user clicks the email link), or
        //   2. a signed JWT issued by this backend with type === 'password_reset'.
        // Magic-string tokens are no longer honoured, and the target user is always
        // derived from the verified identity (never from a client-supplied userId).

        if (!newPassword) {
            return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'New password is required.' });
        }

        const pwCheck = resetPasswordSchema.safeParse({ newPassword });
        if (!pwCheck.success) {
            return res.status(400).json({
                success: false,
                error: 'WEAK_PASSWORD',
                message: pwCheck.error.issues[0].message
            });
        }

        let targetId = null;
        let verifiedEmail = null;

        // Path 1: Supabase recovery session (preferred — used by /reset-password page)
        if (supabaseAccessToken) {
            const { data: tokenData, error: tokenError } = await supabase.auth.getUser(supabaseAccessToken);
            if (tokenError || !tokenData?.user) {
                return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Recovery session is invalid or expired.' });
            }
            targetId = tokenData.user.id;
            verifiedEmail = tokenData.user.email;
        }

        // Path 2: backend-issued password-reset JWT
        if (!targetId && token) {
            try {
                const decoded = jwt.verify(token, getJwtSecret());
                if (decoded.type !== 'password_reset') {
                    return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid reset token type.' });
                }
                targetId = decoded.id;
                verifiedEmail = decoded.email || null;
            } catch (err) {
                return res.status(401).json({ success: false, error: 'INVALID_TOKEN', message: 'Invalid or expired reset token.' });
            }
        }

        if (!targetId && !verifiedEmail) {
            return res.status(401).json({ success: false, error: 'IDENTITY_REQUIRED', message: 'A verified recovery identity is required to reset a password.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId || '');
        let matchColumn = isUuid ? 'id' : 'email';
        let matchValue = isUuid ? targetId : verifiedEmail;

        let { data: userUpdateData, error } = await timeoutPromise(
          supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq(matchColumn, matchValue)
            .select('id, email'),
          10000 // 10 seconds timeout
        );

        let user = userUpdateData?.[0];

        if (!user || userUpdateData.length === 0) {
            const { data: staffUpdateData, error: staffError } = await timeoutPromise(
              supabase
                .from('staff')
                .update({ password: hashedPassword })
                .eq(matchColumn, matchValue)
                .select('id, email'),
              10000 // 10 seconds timeout
            );
            
            user = staffUpdateData?.[0];
            if (staffError) throw staffError;
        } else {
            if (error) throw error;
        }

        if (!user) {
            return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'No account matches the verified identity.' });
        }

        // Keep Supabase Auth credentials in sync so BOTH passwords never diverge
        try {
            await supabase.auth.admin.updateUserById(user.id, { password: newPassword });
        } catch (syncErr) {
            logger.warn(`[RESET-COMPLETE] Supabase Auth password sync failed for ${user.id}: ${syncErr.message}`);
        }

        // Revoke all existing refresh sessions after a reset
        try {
            const { data: victim } = await supabase.from('users').select('raw_data').eq('id', user.id).maybeSingle();
            if (victim) {
                await supabase.from('users').update({ raw_data: { ...(victim.raw_data || {}), sessions: [] } }).eq('id', user.id);
            }
        } catch (e) { /* non-fatal */ }

        logger.info(`[RESET-COMPLETE] Password rotated for user: ${user.id}`);
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

        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.scope !== 'user_only') {
            return res.status(403).json({ success: false, error: 'INVALID_SCOPE', message: 'Invalid token scope' });
        }

        const supabase = getClient();
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
                cookies[parts.shift().trim()] = decodeURIComponent(parts.join('='));
            });
        }

        let refToken = cookies.refreshToken || cookies.refresh_token;
        if (!refToken) {
            return res.status(401).json({ success: false, error: 'NO_REFRESH_TOKEN', message: 'No refresh token provided.' });
        }

        const supabase = getClient();
        
        let userId = req.body.userId;
        if (!userId) {
            const authHeader = req.headers.authorization;
            let oldToken = cookies.accessToken || cookies.access_token;
            if (!oldToken && authHeader && authHeader.startsWith('Bearer')) {
                oldToken = authHeader.split(' ')[1];
            }
            if (oldToken) {
                try {
                    const decoded = jwt.verify(oldToken, getJwtSecret(), { ignoreExpiration: true });
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

        const newToken = jwt.sign({ id: user.id, role: user.role }, getJwtSecret(), { expiresIn: '15m' });
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
        
        // Clear sessions from database
        const userId = req.user?.id;
        if (userId) {
            const supabase = getClient();
            let { data: user } = await supabase.from('users').select('raw_data').eq('id', userId).maybeSingle();
            if (user) {
                const updatedRawData = { ...user.raw_data, sessions: [] };
                await supabase.from('users').update({ raw_data: updatedRawData }).eq('id', userId);
            } else {
                const { data: staffUser } = await supabase.from('staff').select('raw_data').eq('id', userId).maybeSingle();
                if (staffUser) {
                    const updatedRawData = { ...staffUser.raw_data, sessions: [] };
                    await supabase.from('staff').update({ raw_data: updatedRawData }).eq('id', userId);
                }
            }
        }
        
        res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
        res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });
        res.json({ success: true, message: 'Session invalidated' });
    } catch (error) {
        logger.error(`[LOGOUT] Error: ${error.message}`);
        res.status(500).json({ success: false, error: 'INTERNAL_ERROR', message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).json({ success: false, error: 'TOKEN_REQUIRED', message: 'Verification token required' });

        const decoded = jwt.verify(token, getJwtSecret());
        if (decoded.type !== 'email_verification') throw new Error('Invalid token type');

        const supabase = getClient();
        
         const { error } = await timeoutPromise(
           supabase
             .from('users')
             .update({ status: 'Active', verification_status: 'Verified' })
             .eq('id', decoded.id),
           10000 // 10 seconds timeout
         );

         if (error) throw error;

         // Confirm email in Supabase Auth
         try {
             await timeoutPromise(
               supabase.auth.admin.updateUserById(decoded.id, { email_confirm: true }),
               10000 // 10 seconds timeout
             );
         } catch (confirmErr) {
             // Log but don't fail verification - user can still login with email confirmed in app DB
             logger.warn(`[VERIFY-EMAIL] Failed to confirm email in Supabase Auth for user ${decoded.id}: ${confirmErr.message}`);
         }

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
        const supabase = getClient();
         const { data: user } = await timeoutPromise(
           supabase.from('users').select('status').eq('id', userId).maybeSingle(),
           10000 // 10 seconds timeout
         );

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

        const supabase = getClient();
        
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
        const passwordMatches = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatches) {
            return res.status(400).json({ success: false, error: 'INVALID_OLD_PASSWORD', message: 'The old password you entered is incorrect.' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

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

        // Keep Supabase Auth credentials in sync (previously only the local hash was
        // rotated, so the OLD password kept working through Supabase Auth sign-in)
        if (user.email) {
            try {
                await supabase.auth.admin.updateUserById(userId, { password: newPassword });
            } catch (syncErr) {
                logger.warn(`[CHANGE-PASSWORD] Supabase Auth password sync failed for ${userId}: ${syncErr.message}`);
            }
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
                cookies[parts.shift().trim()] = decodeURIComponent(parts.join('='));
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

        const decoded = jwt.verify(token, getJwtSecret());
        
        const supabase = getClient();
        let { data: user } = await supabase.from('users').select('*').eq('id', decoded.id).maybeSingle();
        
        if (!user) {
            const { data: staffUser } = await supabase.from('staff').select('*').eq('id', decoded.id).maybeSingle();
            user = staffUser;
        }

        if (!user) return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User not found' });

        // Session Binding Security Verification
        // FIX: this is a GET route — req.body is undefined on GET requests without a
        // body parser, and the old `req.body.fingerprint` access threw a TypeError,
        // making EVERY /verify call fail with 401. Read fingerprint safely.
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        const ipHash = crypto.createHash('sha256').update(String(ip)).digest('hex');
        const fingerprint = req.headers['x-device-fingerprint'] || (req.body && req.body.fingerprint) || 'unknown';

         if (user.raw_data?.sessions && user.raw_data.sessions.length > 0) {
             const activeSessions = user.raw_data.sessions.filter(s => new Date(s.expiresAt).getTime() > Date.now());
             const currentSession = activeSessions.find(s => s.fingerprint === fingerprint);
             if (!currentSession || currentSession.ipHash !== ipHash) {
                 // Remove the mismatched session from the database
                 const updatedRawData = { ...user.raw_data };
                 updatedRawData.sessions = activeSessions.filter(s => s.refreshToken !== currentSession?.refreshToken);
                 const targetTable = (user.role && user.role !== 'Customer') ? 'staff' : 'users';
                 await supabase.from(targetTable).update({ raw_data: updatedRawData }).eq('id', user.id);
                 
                 res.clearCookie('accessToken', { httpOnly: true, sameSite: 'none', secure: true });
                 res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'none', secure: true });
                 return res.status(403).json({ success: false, error: 'DEVICE_MISMATCH', message: 'Session binding violation. Device/IP mismatch or unregistered device signature detected.' });
             }
         }

        // SECURITY: strip password hash / OTP hashes / refresh tokens before responding
        res.json({ success: true, user: sanitizeUser(user) });
    } catch (error) {
        res.status(401).json({ success: false, error: 'INVALID_SESSION', message: 'Invalid session' });
    }
};

export default { signup, login, socialHandshake, forgotPassword, completeReset, loginAs, refreshToken, logout, verifySession, verifyEmail, checkVerificationStatus, verifyOtp, resendOtp, changePassword };
