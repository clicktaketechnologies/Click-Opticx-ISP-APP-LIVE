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
        const { data, error } = await supabase.from('users').update({
            ...userData,
            updated_at: new Date().toISOString()
        }).eq('id', id).select().single();
        if (error) throw error;
        res.json({ success: true, user: data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const softDeleteUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    // 1. Move to past_records (if table exists, otherwise skip)
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

    // 2. Programmatic Cascade Deletion in related business modules
    try {
        await Promise.all([
            supabase.from('user_roles').delete().eq('user_id', id),
            supabase.from('signup_requests').delete().eq('user_id', id),
            supabase.from('kyc_requests').delete().eq('user_id', id),
            supabase.from('kyc_files').delete().eq('user_id', id),
            supabase.from('invoices').delete().eq('user_id', id),
            supabase.from('payments').delete().eq('user_id', id),
            supabase.from('emergency_loads').delete().eq('user_id', id),
            supabase.from('topup_requests').delete().eq('user_id', id),
            supabase.from('support_tickets').delete().eq('user_id', id),
            supabase.from('audit_logs').delete().eq('user_id', id),
            supabase.from('email_logs').delete().eq('user_id', id),
        ]);
        logger.info(`[USER-DELETE] Cascade deleted all dependent business records for ${id}`);
    } catch (e) {
        logger.warn(`[USER-DELETE] Business cascade delete warning: ${e.message}`);
    }

    // 3. Remove user from Supabase Auth identity provider
    try {
        await supabase.auth.admin.deleteUser(id);
        logger.info(`[USER-DELETE] Successfully deleted user ${id} from Supabase Auth`);
    } catch (e) {
        logger.warn(`[USER-DELETE] Supabase Auth deletion warning: ${e.message}`);
    }

    // 4. Permanent removal from public.users table
    const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:deleted', { id });
    }
    
    logger.info(`[USER] PERMANENT DELETE: ${id} by Admin: ${req.user.id}`);
    res.json({ success: true, message: 'User permanently removed from production' });
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

export default {
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
