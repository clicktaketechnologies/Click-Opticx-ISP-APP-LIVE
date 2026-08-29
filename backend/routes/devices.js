const express = require('express');
const router = express.Router();
const deviceConnector = require('../services/DeviceConnectorService');
const logger = require('../utils/logger');

/**
 * @route POST /api/devices/test
 * @desc Test connectivity to a device (SNMP, SSH, or MikroTik)
 */
router.post('/test', async (req, res) => {
    const { type, host, credentials, protocol } = req.body;
    
    try {
        logger.info(`[DEVICE-TEST] Attempting ${protocol} connection to ${host}`);
        let result;

        switch (protocol.toUpperCase()) {
            case 'SNMP':
                // Query system description OID: .1.3.6.1.2.1.1.1.0
                result = await deviceConnector.querySNMP(host, credentials.community || 'public', ['.1.3.6.1.2.1.1.1.0']);
                break;
            case 'SSH':
                result = await deviceConnector.executeSSH(host, credentials.username, credentials.password, 'echo "Handshake Successful"');
                break;
            case 'MIKROTIK':
                result = await deviceConnector.queryMikroTik(host, credentials.username, credentials.password, '/system/identity/print');
                break;
            default:
                return res.status(400).json({ success: false, message: 'Unsupported protocol' });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        logger.error(`[DEVICE-TEST] Failed: ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * @route GET /api/devices/poll/:id
 * @desc Force poll telemetry for a specific device
 */
router.get('/poll/:id', async (req, res) => {
    const { id } = req.params;
    // Logic to fetch device details from DB and trigger poller
    res.json({ success: true, status: 'Polling initiated', taskId: `POLL-${id}-${Date.now()}` });
});

module.exports = router;
