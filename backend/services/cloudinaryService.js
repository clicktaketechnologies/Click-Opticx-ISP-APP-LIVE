const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

class CloudinaryService {
    setCredentials(config) {
        cloudinary.config({
            cloud_name: config.email || config.cloud_name, // fallback or using email field for cloud_name
            api_key: config.api_key,
            api_secret: config.secret
        });
    }

    async testConnection() {
        try {
            // A simple ping to Cloudinary API
            await cloudinary.api.ping();
            return { success: true, status: 'VERIFIED' };
        } catch (error) {
            logger.error(`[Cloudinary Test] ${error.message}`);
            return { success: false, status: 'FAILED', message: error.message };
        }
    }

    async uploadFile(fileName, filePath, fileType) {
        try {
            const result = await cloudinary.uploader.upload(filePath, {
                public_id: fileName.split('.')[0],
                resource_type: 'auto',
                folder: 'kyc_sync'
            });
            return {
                id: result.public_id,
                url: result.secure_url
            };
        } catch (error) {
            logger.error(`[Cloudinary Upload] ${error.message}`);
            throw error;
        }
    }
}

module.exports = new CloudinaryService();
