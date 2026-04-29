const firebaseService = require('./firebaseService');
const smsService = require('./smsService');
const logger = require('../utils/logger');
const emailRouter = require('../modules/email/email-router');

/**
 * Smart Notification Engine
 * Orchestrates delivery through Push (Primary) and SMS (Fallback/Secondary)
 * 
 * @param {object} params - Notification parameters
 * @param {string} params.userId - Recipient user ID
 * @param {string} params.userPhone - Recipient phone number (for SMS)
 * @param {string} params.fcmToken - Firebase device token (for Push)
 * @param {string} params.event - Event trigger (e.g., 'PACKAGE_ACTIVATED')
 * @param {string} params.title - Notification title
 * @param {string} params.body - Notification body/message
 * @param {string} params.email - Recipient email (for Email)
 * @param {string} params.html - HTML body (optional for Email)
 * @param {object} params.config - Global CommunicationSettings
 * @param {object} params.data - Extra data for push payload
 * @returns {Promise<object>} - Delivery report
 */
async function dispatchNotification({
    userId,
    userPhone,
    fcmToken,
    event,
    title,
    body,
    email,
    html,
    config,
    data = {}
}) {
    const { notificationMode, autoFallbackEnabled, globalNotificationEnabled } = config;

    if (globalNotificationEnabled === false) {
        logger.warn(`[ENGINE] Notifications disabled globally. Skipping event: ${event}`);
        return { success: false, status: 'Disabled' };
    }

    const report = {
        userId,
        event,
        timestamp: new Date().toISOString(),
        gatewayUsed: null,
        fallbackUsed: null,
        status: 'Pending',
        retryCount: 0
    };

    try {
        // Mode 1: Push Only
        if (notificationMode === 'Push_Only') {
            const res = await firebaseService.sendPush(fcmToken, title, body, data);
            report.gatewayUsed = 'Firebase';
            report.status = 'Delivered';
            report.messageId = res;
            return report;
        }

        // Mode 2: SMS Only
        if (notificationMode === 'SMS_Only') {
            const res = await smsService.sendSMS(userPhone, body, config);
            report.gatewayUsed = 'SMS';
            report.status = 'Delivered';
            report.messageId = res.messageId;
            return report;
        }

        // Mode 3: Push + SMS (Dual Delivery)
        if (notificationMode === 'Push_And_SMS') {
            let pushRes = null;
            let smsRes = null;
            
            try { pushRes = await firebaseService.sendPush(fcmToken, title, body, data); } catch (e) { logger.error(`[ENGINE] Push part of dual delivery failed: ${e.message}`); }
            try { smsRes = await smsService.sendSMS(userPhone, body, config); } catch (e) { logger.error(`[ENGINE] SMS part of dual delivery failed: ${e.message}`); }
            
            report.gatewayUsed = 'Firebase + SMS';
            report.status = (pushRes || smsRes) ? 'Delivered' : 'Failed';
            return report;
        }

        // Mode 4: Auto Fallback (Firebase First -> SMS Fallback)
        if (notificationMode === 'Auto_Fallback') {
            try {
                // Try Push First
                if (fcmToken) {
                    const res = await firebaseService.sendPush(fcmToken, title, body, data);
                    report.gatewayUsed = 'Firebase';
                    report.status = 'Delivered';
                    report.messageId = res;
                    return report;
                } else {
                    throw new Error('No FCM token available for user');
                }
            } catch (error) {
                logger.warn(`[ENGINE] Push failed for ${userId}: ${error.message}. Attempting SMS Fallback...`);
                
                if (autoFallbackEnabled) {
                    const res = await smsService.sendSMS(userPhone, body, config);
                    report.gatewayUsed = 'Firebase'; // Intended
                    report.fallbackUsed = 'SMS';
                    report.status = 'Delivered';
                    report.messageId = res.messageId;
                    return report;
                } else {
                    report.status = 'Failed';
                    report.error = 'Push failed and fallback disabled';
                    return report;
                }
            }
        }

        // Mode 5: Email Only (Phase 1 Addition)
        if (notificationMode === 'Email_Only' || (email && !fcmToken && !userPhone)) {
            const res = await emailRouter.sendEmail({
                to: email,
                subject: title,
                html: html || `<p>${body}</p>`
            });
            report.gatewayUsed = 'Email (' + (res.provider || 'unknown') + ')';
            report.status = res.success ? 'Delivered' : 'Failed';
            report.messageId = res.messageId;
            return report;
        }

        throw new Error(`Invalid notification mode: ${notificationMode}`);
    } catch (error) {
        logger.error(`[ENGINE] Dispatch Critical Error: ${error.message}`);
        report.status = 'Failed';
        report.error = error.message;
        return report;
    }
}

module.exports = { dispatchNotification };
