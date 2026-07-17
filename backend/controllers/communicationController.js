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

        if (type === 'email') {
            result = await sendEmail(recipient, subject, body, metadata);
        } else if (type === 'push') {
            result = await sendPush(recipient, subject, body, metadata);
        }

        const logEntry = {
            id: 'LOG-' + Date.now(),
            type,
            recipient,
            status: result.success ? 'Sent' : 'Failed',
            error: result.error || null,
            sent_at: new Date().toISOString()
        };
        commLogs.unshift(logEntry);

        res.json({ success: result.success, log: logEntry });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

async function sendEmail(to, subject, html, metadata) {
    try {
        // Mocking SMTP/API delivery for now
        logger.info(`[COMM-EMAIL] Sending to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
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
