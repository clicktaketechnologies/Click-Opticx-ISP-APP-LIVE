import admin from 'firebase-admin';
import fs from 'fs';
import logger from '../utils/logger.js';
import storageRouter from '../modules/storage/storage-router.js';
import configManager from '../services/config-manager.js';

const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

export const uploadKYC = async (req, res) => {
    try {
        const { userId, userName } = req.body;
        const uploadedFiles = req.files;
        const supabase = configManager.getSupabaseClient();
        const io = req.app.get('socketio');

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const kycRecords = [];

        for (const file of uploadedFiles) {
            let uploadResult;
            try {
                uploadResult = await storageRouter.uploadFile(file, { userId, userName });
                logger.info(`[KYC] Multi-cloud upload successful via ${uploadResult.provider}`);
            } catch (storageError) {
                logger.warn(`[KYC] Cloud upload failed, falling back to local: ${storageError.message}`);
                uploadResult = { url: `/uploads/kyc/${file.filename}`, provider: 'local', checksum: 'none' };
            }

            const kycId = 'KYC-' + Date.now();
            const kycData = {
                id: kycId,
                user_id: userId,
                user_name: userName,
                file_name: file.originalname,
                file_url: uploadResult.url,
                provider: uploadResult.provider,
                checksum: uploadResult.checksum || null,
                file_type: file.mimetype,
                size: file.size,
                status: 'TEMP',
                created_at: new Date().toISOString()
            };

            // 1. Supabase Primary Write
            const { error: sbError } = await supabase.from('kyc_files').upsert(kycData);
            if (sbError) logger.error(`[KYC-SUPABASE] Write failed: ${sbError.message}`);

            // 2. Firebase Mirror (Only if enabled)
            if (isFirebaseWriteEnabled()) {
                try {
                    const db = admin.firestore();
                    await db.collection('kyc_requests').doc(kycId).set(kycData);
                } catch (fbErr) {
                    logger.warn(`[KYC-MIRROR] Firebase mirror failed: ${fbErr.message}`);
                }
            }

            kycRecords.push(kycData);
            if (io) io.emit('kyc_uploaded', kycData);
        }

        res.json({ success: true, count: kycRecords.length, list: kycRecords });
    } catch (error) {
        logger.error(`[KYC Upload] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const getKYCList = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const { data, error } = await supabase
            .from('kyc_files')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ success: true, list: data });
    } catch (error) {
        logger.error(`[KYC List] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const approveKYC = async (req, res) => {
    try {
        const { userId, requestId } = req.body;
        const supabase = configManager.getSupabaseClient();
        const io = req.app.get('socketio');

        logger.info(`[KYC-APPROVE] Approving for user: ${userId}`);

        // 1. Update User Status in Postgres
        // FIX: column names were camelCase but the schema (supabase_schema.sql) is
        // snake_case — approve/reject/status/queue all threw unknown-column errors.
        const { error: userError } = await supabase
            .from('users')
            .update({ 
                verification_status: 'Verified',
                is_kyc_verified: true,
                status: 'Active'
            })
            .eq('id', userId);

        if (userError) throw userError;

        // 2. Update KYC Request Status
        if (requestId) {
            await supabase.from('kyc_files').update({ status: 'Approved' }).eq('id', requestId);
        }

        // 3. Sync to Firebase (Mirror)
        if (isFirebaseWriteEnabled()) {
            try {
                const db = admin.firestore();
                // Update specific user node
                const stateRef = db.collection('registry').doc('master_state');
                const doc = await stateRef.get();
                if (doc.exists) {
                    const state = doc.data();
                    const userIdx = state.users.findIndex(u => u.id === userId);
                    if (userIdx !== -1) {
                        state.users[userIdx].verificationStatus = 'VERIFIED';
                        state.users[userIdx].isKYCVerified = true;
                        state.users[userIdx].status = 'Active';
                        await stateRef.update({ users: state.users });
                    }
                }
            } catch (fbErr) {
                logger.warn(`[KYC-SYNC-FB] Mirror failed: ${fbErr.message}`);
            }
        }

        if (io) io.emit('kyc_status_changed', { userId, status: 'Approved' });

        res.json({ success: true, message: 'Identity verified and access granted.' });
    } catch (error) {
        logger.error(`[KYC Approve] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

export const rejectKYC = async (req, res) => {
    try {
        const { userId, reason } = req.body;
        const supabase = configManager.getSupabaseClient();

        logger.info(`[KYC-REJECT] Rejecting for user: ${userId} - Reason: ${reason}`);

        await supabase
            .from('users')
            .update({ 
                verification_status: 'Revision',
                is_kyc_verified: false,
                kyc_rejected_reason: reason
            })
            .eq('id', userId);

        const io = req.app.get('socketio');
        if (io) io.emit('kyc_status_changed', { userId, status: 'Rejected' });

        res.json({ success: true, message: 'Identity rejected. Revision requested.' });
    } catch (error) {
        logger.error(`[KYC Reject] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/kyc/status?userId=xxx — Subscriber polls their own KYC status
export const getKYCStatus = async (req, res) => {
    try {
        const userId = req.query.userId || req.user?.id;
        if (!userId) return res.status(400).json({ success: false, message: 'User ID required' });

        const supabase = configManager.getSupabaseClient();
        const { data: user, error } = await supabase
            .from('users')
            .select('kyc_status, verification_status, is_kyc_verified, is_kyc_submitted, kyc_rejected_reason')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            kyc_status: user.kyc_status || 'unverified',
            verificationStatus: user.verification_status || 'Unverified',
            isKYCVerified: user.is_kyc_verified || false,
            isKYCSubmitted: user.is_kyc_submitted || false,
            rejectedReason: user.kyc_rejected_reason || null
        });
    } catch (error) {
        logger.error(`[KYC Status] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

// GET /api/kyc/queue — Admin gets pending KYC queue
export const getKYCQueue = async (req, res) => {
    try {
        const supabase = configManager.getSupabaseClient();
        const status = req.query.status || 'pending';
        
        let query = supabase
            .from('users')
            .select('id, name, email, phone, kyc_status, verification_status, is_kyc_submitted, is_kyc_verified, created_at')
            .eq('is_kyc_submitted', true);
        
        if (status !== 'all') {
            query = query.eq('kyc_status', status);
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(200);

        if (error) throw error;
        res.json({ success: true, queue: data || [] });
    } catch (error) {
        logger.error(`[KYC Queue] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

export default { uploadKYC, getKYCList, approveKYC, rejectKYC, getKYCStatus, getKYCQueue };

