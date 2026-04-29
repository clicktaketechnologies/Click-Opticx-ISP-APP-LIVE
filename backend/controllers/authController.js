const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const supabaseAuth = require('../modules/auth/supabase-auth');
const roleSync = require('../modules/auth/role-sync');
const configManager = require('../services/config-manager');
const emailWorker = require('../modules/email/worker');

// Helper to determine if we should write to Firebase
const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

exports.signup = async (req, res) => {
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

        const newUser = {
            id: userId,
            name: name,
            username: username,
            email: email,
            phone: phone,
            password: hashedPassword,
            role: role,
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

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        const supabase = configManager.getSupabaseClient();

        // Primary Lookup: Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
            .single();

        if (!user || error) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
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

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const supabase = configManager.getSupabaseClient();

        const { data: user } = await supabase.from('users').select('id, name').eq('email', email).single();
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
