import crypto from 'crypto';
import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

export const listUsers = async (req, res) => {
    try {
        const { search, status, role, packageId } = req.query;
        const supabase = configManager.getSupabaseClient();
        let query = supabase.from('users').select('*').is('deleted', false);

        if (search) {
            query = query.or(`email.ilike.%${search}%,phone.ilike.%${search}%,name.ilike.%${search}%,username.ilike.%${search}%`);
        }
        if (status) {
            query = query.eq('status', status);
        }
        if (role) {
            query = query.eq('role', role);
        }
        if (packageId) {
            query = query.eq('package_id', packageId);
        }

        const { data: users, error } = await query;
        if (error) throw error;
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUser = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { id } = req.params;
        const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) throw error;
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const userData = req.body;
        const { data, error } = await supabase.from('users').insert({
            id: userData.id || 'USR-' + Date.now(),
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        res.json({ success: true, user: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { id } = req.params;
        const userData = req.body;

        // SECURITY FIX: mass-assignment — clients could set ANY column (role,
        // deleted, raw_data, password...). Strict allowlist + privileged guards.
        const EDITABLE_FIELDS = ['name','username','email','phone','address','area','subarea','status','verification_status','is_kyc_verified','is_kyc_submitted','kyc_status','approval_status','package_id','balance','credit_score','referral_points','referral_code','referred_by','activation_count','expiry_date','activation_date','connection_type','management_mode','nas_connection_type','portal_enabled','cnic','deleted','dealer_id','reseller_email','profile_image','fcm_token','internal_notes','tags','connection_id'];
        const updates = {};
        for (const f of EDITABLE_FIELDS) {
            if (userData[f] !== undefined) updates[f] = userData[f];
        }

        // Role changes are SuperAdmin-only
        if (userData.role !== undefined) {
            if (req.user.role !== 'SuperAdmin') {
                return res.status(403).json({ success: false, message: 'Only a SuperAdmin can change user roles.' });
            }
            updates.role = userData.role;
        }

        // Password changes must be hashed
        if (userData.password) {
            const bcrypt = (await import('bcryptjs')).default;
            updates.password = await bcrypt.hash(String(userData.password), 10);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No updatable fields provided.' });
        }

        const { data, error } = await supabase.from('users').update({
            ...updates,
            updated_at: new Date().toISOString()
        }).eq('id', id).select().single();
        if (error) throw error;
        const { password: _pw, raw_data: _rd, ...safeUser } = data || {};
        res.json({ success: true, user: safeUser });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const softDeleteUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    // 1. Archive to past_records (best-effort audit trail)
    try {
        const { data: user } = await supabase.from('users').select('*').eq('id', id).single();
        if (user) {
            await supabase.from('past_records').insert({
                ...user,
                deleted_at: new Date().toISOString(),
                deleted_by: req.user.id
            });
        }
    } catch (e) {
        logger.warn(`[USER-DELETE] Could not archive to past_records: ${e.message}`);
    }

    // FIX: this endpoint performed a PERMANENT delete (cascade of invoices,
    // payments, logs + Supabase Auth deletion + row removal) which made
    // restoreUser a guaranteed no-op. It is now a true SOFT delete.
    const { error } = await supabase
        .from('users')
        .update({
            deleted: true,
            status: 'Disabled',
            updated_at: new Date().toISOString()
        })
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:deleted', { id });
    }
    
    logger.info(`[USER] SOFT DELETE: ${id} by Admin: ${req.user.id}`);
    res.json({ success: true, message: 'User archived (soft-deleted). Can be restored.' });
};

export const restoreUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
        .from('users')
        .update({ deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:restored', { id });
    }
    
    res.json({ success: true });
};

export const approveSignup = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    const { data: request, error } = await supabase
        .from('signup_requests')
        .update({
            status: 'Approved',
            processed_at: new Date().toISOString(),
            processed_by: req.user.id
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const newUserId = 'USR-' + Date.now();
    const { error: userError } = await supabase.from('users').insert({
        id: newUserId,
        name: request.name,
        email: request.email,
        phone: request.phone,
        username: request.username,
        status: 'Verification Pending',
        role: 'Customer',
        created_at: new Date().toISOString()
    });
    
    if (userError) {
        logger.error(`[SIGNUP-APPROVE] User creation failed: ${userError.message}`);
        return res.status(500).json({ success: false, message: userError.message });
    }
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('signup:approved', { id, request });
        io.emit('user:created', { id: newUserId, ...request, status: 'Verification Pending', role: 'Customer' });
    }
    
    res.json({ success: true, request });
};

export const rejectSignup = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    const { reason } = req.body;
    
    const { data: request, error } = await supabase
        .from('signup_requests')
        .update({
            status: 'Rejected',
            duplicate_reason: reason || 'Rejected by admin',
            processed_at: new Date().toISOString(),
            processed_by: req.user.id
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('signup:rejected', { id, request });
    }
    
    res.json({ success: true, request });
};

export const transferUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    const { newDealerId } = req.body;
    const adminId = req.user.id;

    try {
        // 1. Get current user data
        const { data: user, error: fetchError } = await supabase.from('users').select('dealer_id, name').eq('id', id).single();
        if (fetchError || !user) return res.status(404).json({ success: false, message: 'User not found' });

        const oldDealerId = user.dealer_id;

        // 2. Update dealer_id
        const { error: updateError } = await supabase
            .from('users')
            .update({ dealer_id: newDealerId, updated_at: new Date().toISOString() })
            .eq('id', id);
        
        if (updateError) throw updateError;

        // 3. Create Audit Log
        const { error: auditError } = await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'USER_TRANSFER',
            user_id: id,
            admin_id: adminId,
            details: `Transferred user ${user.name} from Dealer ${oldDealerId} to ${newDealerId}`,
            type: 'RELATION_CHANGE',
            created_at: new Date().toISOString()
        });
        if (auditError) logger.error(`[AUDIT] Failed to log transfer: ${auditError.message}`);

        res.json({ success: true, message: 'User transferred successfully' });
    } catch (error) {
        logger.error(`[USER-TRANSFER] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const importUsers = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    try {
        const { users } = req.body; // Expecting an array of user objects
        if (!users || !Array.isArray(users)) {
            return res.status(400).json({ success: false, message: 'Users array is required' });
        }

        // Add IDs and timestamps if missing
        const usersToInsert = users.map(user => ({
            id: user.id || 'USR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            ...user,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }));

        const { data, error } = await supabase.from('users').insert(usersToInsert).select();
        if (error) throw error;

        // Audit Log
        await supabase.from('audit_logs').insert({
            id: crypto.randomUUID(),
            action: 'USER_IMPORT',
            admin_id: req.user.id,
            details: `Imported ${usersToInsert.length} users via batch insert`,
            type: 'DATA_IMPORT'
        });

        res.json({ success: true, count: data.length, users: data });
    } catch (error) {
        logger.error(`[USER-IMPORT] Error: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const verifyUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                verification_status: 'Verified',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        // Also confirm in Supabase Auth just in case
        try {
            await supabase.auth.admin.updateUserById(id, { email_confirm: true });
        } catch (e) {}

        res.json({ success: true, message: 'User verified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const unverifyUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                verification_status: 'Unverified',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        
        try {
            await supabase.auth.admin.updateUserById(id, { email_confirm: false });
        } catch (e) {}

        res.json({ success: true, message: 'User unverified successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const disableLogin = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'Disabled',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        res.json({ success: true, message: 'User login disabled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const enableLogin = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    try {
        const { error } = await supabase
            .from('users')
            .update({ 
                status: 'Active',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        res.json({ success: true, message: 'User login enabled successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const resendVerification = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    try {
        const { data: user, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) throw error;

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

        // FIX 1: OTP is now stored bcrypt-hashed — verifyOtp compares against
        // verificationCode.hash, but this endpoint stored { code } so OTP
        // verification ALWAYS failed with "No active verification code found".
        const bcrypt = (await import('bcryptjs')).default;
        const hashedOtp = await bcrypt.hash(otpCode, 10);
        const rawData = user.raw_data || {};
        rawData.verificationCode = { hash: hashedOtp, expiresAt, verified: false };

        await supabase.from('users').update({ raw_data: rawData }).eq('id', id);

        // FIX 2: the code was never delivered — actually send the email now.
        let emailSent = false;
        if (user.email) {
            try {
                const { sendDirectEmail } = await import('../modules/email/resend-direct.js');
                await sendDirectEmail({
                    to: user.email,
                    subject: 'Your Verification Code',
                    html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
                             <h2 style="color:#0f172a">Verify your account</h2>
                             <p>Your verification code is:</p>
                             <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1570ef">${otpCode}</p>
                             <p style="color:#64748b;font-size:13px">This code expires in 10 minutes.</p>
                           </div>`,
                    type: 'otp'
                });
                emailSent = true;
            } catch (mailErr) {
                logger.error(`[RESEND-VERIFICATION] Email dispatch failed for ${id}: ${mailErr.message}`);
            }
        }

        res.json({
            success: true,
            emailSent,
            message: emailSent
                ? 'A new verification code has been sent to the account email.'
                : 'Verification code generated, but the email could not be delivered. Check email provider configuration.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export default {
    verifyUser,
    unverifyUser,
    disableLogin,
    enableLogin,
    resendVerification,
    listUsers,
    getUser,
    createUser,
    updateUser,
    softDeleteUser,
    restoreUser,
    approveSignup,
    rejectSignup,
    transferUser,
    importUsers
};
