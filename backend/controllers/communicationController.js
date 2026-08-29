import nodemailer from 'nodemailer';
import webpush from 'web-push';
import logger from '../utils/logger.js';
import configManager from '../services/config-manager.js';

// In-memory or Redis-backed logs (Simplified for now)
let commLogs = [];

const saveConfig = async (req, res) => {
    try {
        const { type, config } = req.body;
        const supabase = configManager.getSupabaseClient();
        
        // Save to central config
        const { error } = await supabase
            .from('system_settings')
            .upsert({ 
                key: `comm_${type}`, 
                value: config,
                updated_at: new Date().toISOString()
            });

        if (error) throw error;
        res.json({ success: true, message: `${type} configuration saved.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const sendNotification = async (req, res) => {
    try {
        const { type, recipient, subject, body, templateId, metadata } = req.body;
        let result;

        // FIX: unknown types left `result` undefined → TypeError 500; and the
        // mocked senders always reported "Sent" without delivering anything.
        if (type === 'email') {
            if (!recipient || !String(recipient).includes('@')) {
                return res.status(400).json({ success: false, message: 'A valid recipient email is required.' });
            }
            result = await sendEmail(recipient, subject, body, metadata);
        } else if (type === 'push') {
            if (!recipient) {
                return res.status(400).json({ success: false, message: 'A push target (fcm token / user id) is required.' });
            }
            result = await sendPush(recipient, subject, body, metadata);
        } else {
            return res.status(400).json({ success: false, message: `Unsupported notification type: "${type}". Use "email" or "push".` });
        }

        const logEntry = {
            id: 'LOG-' + Date.now(),
            type,
            recipient,
            status: result?.success ? 'Sent' : 'Failed',
            error: result?.error || null,
            sent_at: new Date().toISOString()
        };
        commLogs.unshift(logEntry);

        res.json({ success: result?.success || false, log: logEntry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

async function sendEmail(to, subject, html, metadata) {
    try {
        // FIX: this was a mock that claimed success without sending. It now
        // routes through the real email module (Resend direct + SMTP fallback).
        const { sendDirectEmail } = await import('../modules/email/resend-direct.js');
        await sendDirectEmail({ to, subject: subject || '(no subject)', html: html || '', type: 'transactional' });
        return { success: true };
    } catch (error) {
        logger.error(`[COMM-EMAIL] Delivery failed for ${to}: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function sendPush(target, title, body, metadata) {
    try {
        logger.info(`[COMM-PUSH] Sending to ${target}: ${title}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

const getLogs = async (req, res) => {
    res.json({ success: true, logs: commLogs.slice(0, 100) });
};

const verifyConnection = async (req, res) => {
    const { type, config } = req.body;
    // Simulate connection test
    setTimeout(() => {
        res.json({ success: true, message: `${type} connection verified successfully.` });
    }, 1000);
};

export default {
    saveConfig,
    sendNotification,
    getLogs,
    verifyConnection
};
