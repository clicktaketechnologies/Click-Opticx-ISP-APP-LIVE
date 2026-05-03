const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

exports.listUsers = async (req, res) => {
    // Placeholder for now
    res.json({ success: true, users: [] });
};

exports.getUser = async (req, res) => {
    // Placeholder for now
    res.json({ success: true, user: {} });
};

exports.createUser = async (req, res) => {
    // Placeholder for now
    res.json({ success: true, user: {} });
};

exports.updateUser = async (req, res) => {
    // Placeholder for now
    res.json({ success: true, user: {} });
};

exports.softDeleteUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
        .from('users')
        .update({ deleted: true, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    // Emit real-time event so all connected clients remove the user
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:deleted', { id });
    }
    
    logger.info(`[USER] Soft deleted: ${id} by Admin: ${req.user.id}`);
    res.json({ success: true });
};

exports.restoreUser = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    const { error } = await supabase
        .from('users')
        .update({ deleted: false, updated_at: new Date().toISOString() })
        .eq('id', id);
    
    if (error) return res.status(500).json({ success: false, message: error.message });
    
    // Emit real-time event
    const io = req.app.get('socketio');
    if (io) {
        io.emit('user:restored', { id });
    }
    
    res.json({ success: true });
};

exports.approveSignup = async (req, res) => {
    const supabase = configManager.getSupabaseClient();
    const { id } = req.params;
    
    // 1. Mark signup request as approved
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
    
    // 2. Create the actual user record
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
        // Emit user created event so frontend can pick it up
        io.emit('user:created', { id: newUserId, ...request, status: 'Verification Pending', role: 'Customer' });
    }
    
    res.json({ success: true, request });
};

exports.rejectSignup = async (req, res) => {
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
