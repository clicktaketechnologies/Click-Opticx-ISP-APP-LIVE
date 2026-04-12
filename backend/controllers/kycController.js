const KYC = require('../models/KYC');
const User = require('../models/User');
const fs = require('fs');
const logger = require('../utils/logger');

exports.uploadKYC = async (req, res) => {
    try {
        const { userId, userName } = req.body;
        const uploadedFiles = req.files;

        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        const io = req.app.get('socketio');
        const kycRecords = [];

        for (const file of uploadedFiles) {
            const kyc = new KYC({
                user_id: userId,
                userName,
                file_name: file.originalname,
                temp_path: file.path,
                file_type: file.mimetype,
                size: file.size,
                status: 'TEMP'
            });

            await kyc.save();
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
        const list = await KYC.find().populate('user_id', 'name email');
        res.json({ success: true, list });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
