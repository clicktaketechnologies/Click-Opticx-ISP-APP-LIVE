const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { exec } = require('child_process');

/**
 * @route POST /api/radius/coa
 * @desc Send RADIUS Change of Authorization (CoA) or Disconnect Message
 */
router.post('/coa', async (req, res) => {
    const { username, action, attributes } = req.body;
    
    try {
        logger.info(`[RADIUS-CoA] Sending ${action} for User: ${username}`);
        
        // action: 'disconnect' or 'coa'
        // In production, this calls radclient (FreeRADIUS)
        const radCommand = `echo "User-Name=${username},${attributes}" | radclient -x ${process.env.RADIUS_SERVER_IP} ${action} ${process.env.RADIUS_SECRET}`;
        
        // For simulation if radclient is not present
        if (process.env.NODE_ENV !== 'production') {
            return res.json({ success: true, message: `Simulated RADIUS ${action} successful` });
        }

        exec(radCommand, (error, stdout, stderr) => {
            if (error) {
                logger.error(`[RADIUS-CoA-ERROR] ${error.message}`);
                return res.status(500).json({ success: false, message: 'RADIUS Client Failure' });
            }
            res.json({ success: true, stdout });
        });
        
    } catch (error) {
        logger.error(`[RADIUS-CoA-FATAL] ${error.message}`);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
