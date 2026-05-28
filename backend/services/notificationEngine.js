import firebaseService from './firebaseService.js';
import smsService from './smsService.js';
import logger from '../utils/logger.js';
import emailRouter from '../modules/email/email-router.js';

/**
 * Smart Notification Engine
 * Orchestrates delivery through Push (Primary) and SMS (Fallback/Secondary)
 */
export async function dispatchNotification({
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

        // Mode 5: Email Only / implicit email fallback (when no push or SMS channel available)
        if (notificationMode === 'Email_Only' || (!fcmToken && !userPhone && email)) {
            if (!email) {
                report.status = 'Failed';
                report.error = 'Email_Only mode selected but no email address provided';
                return report;
            }
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

export default { dispatchNotification };
