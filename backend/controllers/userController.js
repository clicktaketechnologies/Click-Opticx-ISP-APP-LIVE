import configManager from '../services/config-manager.js';
import logger from '../utils/logger.js';

export const listUsers = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data: users, error } = await supabase.from('users').select('*').is('deleted', false);
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
    
    const { error } = await supabase
        .from('users')
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:deleted', { id });
    }
    
    logger.info(`[USER] Soft deleted: ${id} by Admin: ${req.user.id}`);
    res.json({ success: true });
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

export default {
    listUsers,
    getUser,
    createUser,
    updateUser,
    softDeleteUser,
    restoreUser,
    approveSignup,
    rejectSignup
};
