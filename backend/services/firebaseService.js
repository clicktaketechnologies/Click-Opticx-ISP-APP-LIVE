const admin = require('firebase-admin');
const logger = require('../utils/logger');

/**
 * Send a push notification using Firebase Cloud Messaging (FCM)
 * @param {string} token - FCM device token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 * @returns {Promise<string>} - Firebase message ID
 */
async function sendPush(token, title, body, data = {}) {
    if (!admin.apps.length) {
        throw new Error('Firebase Admin not initialized');
    }

    if (!token) {
        throw new Error('No device token provided');
    }

    try {
        const message = {
            notification: { title, body },
            data: data || {},
            token: token
        };

        const response = await admin.messaging().send(message);
        logger.info(`[FCM] Sent successfully: ${response}`);
        return response;
    } catch (error) {
        logger.error(`[FCM] Error: ${error.message}`);
        throw error;
    }
}

module.exports = { sendPush };
