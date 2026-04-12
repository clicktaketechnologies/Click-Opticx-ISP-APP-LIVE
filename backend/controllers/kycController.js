const admin = require('firebase-admin');
const fs = require('fs');
const logger = require('../utils/logger');

exports.uploadKYC = async (req, res) => {
    try {
        const { userId, userName } = req.body;
        const uploadedFiles = req.files;

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        if (!admin.apps.length) {
            return res.status(503).json({ success: false, message: 'Database service not initialized' });
        }

        const db = admin.firestore();
        const io = req.app.get('socketio');
        const kycRecords = [];

        for (const file of uploadedFiles) {
            const kycData = {
                user_id: userId,
                userName,
                file_name: file.originalname,
                temp_path: file.path,
                file_type: file.mimetype,
                size: file.size,
                status: 'TEMP',
                created_at: admin.firestore.FieldValue.serverTimestamp()
            };

            const docRef = await db.collection('kyc_requests').add(kycData);
            const kyc = { id: docRef.id, ...kycData };
            kycRecords.push(kyc);

            // Emit real-time event
            io.emit('kyc_uploaded', kyc);
        }

        res.json({ success: true, count: kycRecords.length, list: kycRecords });
    } catch (error) {
        logger.error(`[KYC Upload] Error: ${error.message}`);
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getKYCList = async (req, res) => {
    try {
        if (!admin.apps.length) {
            return res.status(503).json({ success: false, message: 'Database service not initialized' });
        }
        
        const db = admin.firestore();
        const snapshot = await db.collection('kyc_requests').orderBy('created_at', 'desc').limit(100).get();
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        res.json({ success: true, list });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
