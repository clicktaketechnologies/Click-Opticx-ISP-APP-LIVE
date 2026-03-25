const { Client } = require('ssh2');
const logger = require('../utils/logger');

// ─── BRAND COMMAND TEMPLATES ──────────────────────────────────────────────────
const BRAND_TEMPLATES = {
    Huawei: {
        rebootOnu: (port, ontId) => `interface gpon ${port}\nont reboot ${ontId}`,
        resetOnu: (port, ontId) => `interface gpon ${port}\nont factory-setting-restore ${ontId}`,
        getSignal: (port, ontId) => `display ont optical-info ${port} ${ontId}`,
        discovery: 'display ont autofind all'
    },
    ZTE: {
        rebootOnu: (port, ontId) => `pon-onu-mng gpon-onu_${port}:${ontId}\nreboot`,
        resetOnu: (port, ontId) => `pon-onu-mng gpon-onu_${port}:${ontId}\nrestore factory`,
        getSignal: (port, ontId) => `show pon power attenuation gpon-onu_${port}:${ontId}`,
        discovery: 'show pon onu uncfg'
    },
    VSOL: {
        rebootOnu: (port, ontSn) => `interface epon ${port}\nonu ${ontSn} reboot`,
        resetOnu: (port, ontSn) => `interface epon ${port}\nonu ${ontSn} reset`, // VSOL often uses reset for factory
        getSignal: (port, ontSn) => `show ont optical-info ${port} ${ontSn}`,
        discovery: 'show ont unauth'
    },
    BDCOM: {
        rebootOnu: (port, ontId) => `interface epon ${port}:${ontId}\nepon onu reboot`,
        resetOnu: (port, ontId) => `interface epon ${port}:${ontId}\nepon onu reset`,
        getSignal: (port, ontId) => `show epon interface epon ${port}:${ontId} onu optical-parameter`,
        discovery: 'show epon unauthed-onu'
    }
};

// ─── Helper: Execute SSH Commands ─────────────────────────────────────────────
async function executeSsh(olt, commands) {
    return new Promise((resolve, reject) => {
        const conn = new Client();
        conn.on('ready', () => {
            conn.exec(commands.join('\n') + '\nexit\n', (err, stream) => {
                if (err) {
                    conn.end();
                    return reject(err);
                }
                let output = '';
                stream.on('data', (data) => output += data);
                stream.on('close', () => {
                    conn.end();
                    resolve(output);
                });
            });
        }).on('error', (err) => {
            reject(err);
        }).connect({
            host: olt.ip,
            port: olt.port || 22,
            username: olt.username,
            password: olt.password,
            readyTimeout: 10000
        });
    });
}

// ─── OLT Health / Presence ────────────────────────────────────────────────────
exports.checkHealth = async (req, res) => {
    const { olt } = req.body;
    if (!olt || !olt.ip) return res.status(400).json({ success: false, message: 'OLT IP required' });

    try {
        const output = await executeSsh(olt, ['show version' || 'display version']);
        logger.info(`[OLT HEALTH] ${olt.name} (${olt.ip}) - Online`);
        return res.json({ 
            success: true, 
            status: 'Online', 
            details: output.substring(0, 200) 
        });
    } catch (error) {
        logger.warn(`[OLT HEALTH FAILED] ${olt.name}: ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            status: 'Offline', 
            error: error.message 
        });
    }
};

// ─── ONU Actions (Reboot, Reset, Signal) ──────────────────────────────────────
exports.executeOnuAction = async (req, res) => {
    const { olt, onu, action } = req.body;
    if (!olt || !onu || !action) return res.status(400).json({ success: false, message: 'Missing OLT, ONU, or action' });

    const template = BRAND_TEMPLATES[olt.brand];
    if (!template) return res.status(400).json({ success: false, message: `Brand ${olt.brand} not supported` });

    let cmd = '';
    const ontIdentifier = olt.brand === 'VSOL' ? onu.serialNumber : onu.ontId || '1'; // Identifier varies by brand

    switch (action) {
        case 'Reboot': cmd = template.rebootOnu(onu.ponPort, ontIdentifier); break;
        case 'Reset': cmd = template.resetOnu(onu.ponPort, ontIdentifier); break;
        case 'GetSignal': cmd = template.getSignal(onu.ponPort, ontIdentifier); break;
        default: return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    try {
        const output = await executeSsh(olt, [cmd]);
        logger.info(`[ONU ACTION] ${action} on ${onu.serialNumber} via ${olt.name}`);
        return res.json({ success: true, message: `${action} command sent`, output });
    } catch (error) {
        logger.error(`[ONU ACTION ERROR] ${error.message}`);
        return res.status(500).json({ success: false, error: error.message });
    }
};

// ─── Discover Unregistered ONUs ───────────────────────────────────────────────
exports.discoverOnus = async (req, res) => {
    const { olt } = req.body;
    if (!olt) return res.status(400).json({ success: false, message: 'OLT required' });

    const template = BRAND_TEMPLATES[olt.brand];
    if (!template || !template.discovery) return res.status(400).json({ success: false, message: `Discovery not supported for ${olt.brand}` });

    try {
        const output = await executeSsh(olt, [template.discovery]);
        // Note: Real parsing would happen here based on OLT output string
        return res.json({ success: true, rawDiscovery: output });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = exports;
