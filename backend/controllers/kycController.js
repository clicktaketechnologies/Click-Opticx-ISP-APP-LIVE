const admin = require('firebase-admin');
const fs = require('fs');
const logger = require('../utils/logger');
const storageRouter = require('../modules/storage/storage-router');
const configManager = require('../services/config-manager');

const isFirebaseWriteEnabled = () => process.env.FIREBASE_MODE !== 'readonly';

exports.uploadKYC = async (req, res) => {
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

exports.getKYCList = async (req, res) => {
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
