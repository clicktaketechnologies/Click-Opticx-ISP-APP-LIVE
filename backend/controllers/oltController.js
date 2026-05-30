// ─── Block/Unblock Device (MAC Filtering) ───────────────────────────────────
export const blockDevice = async (req, res) => {
    const { olt, onu, macAddress, action } = req.body;
    if (!olt || !onu || !macAddress || !action) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing OLT, ONU, MAC address, or action (BLOCK/ALLOW)' 
        });
    }

    if (!['BLOCK', 'ALLOW'].includes(action)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Action must be either BLOCK or ALLOW' 
        });
    }

    // Validate MAC address format
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid MAC address format' 
        });
    }

    // Normalize MAC address to uppercase with colon separator
    const normalizedMac = macAddress.toUpperCase().replace(/-/g, ':');

    try {
        // In a real implementation, we would get the ponPort and ontId from the onuId
        // For now, we'll assume the onu object contains the necessary information
        // This would need to be improved to properly map onuId to ponPort/ontId
        
        // For demonstration, we'll use placeholder values - in reality, this would come from the ONU data
        const ponPort = onu.ponPort || '0/1/1'; // Default or from onu data
        const ontId = onu.ontId || '1'; // Default or from onu data

        const template = BRAND_TEMPLATES[olt.brand];
        if (!template) {
            return res.status(400).json({ 
                success: false, 
                message: `Brand ${olt.brand} not supported` 
            });
        }

        // Check if blockDevice is supported for this brand
        if (typeof template.blockDevice !== 'function') {
            return res.status(400).json({ 
                success: false, 
                message: `Device blocking/unblocking not supported for brand ${olt.brand}` 
            });
        }

        const cmd = template.blockDevice(ponPort, ontId, normalizedMac, action);
        const output = await executeSsh(olt, [cmd]);
        
        logger.info(`[DEVICE BLOCK] ${action} MAC ${normalizedMac} for ONU ${onu.serialNumber} via ${olt.name}`);
        
        // Emit audit log
        // In a real implementation, we would emit this to the audit log system
        logger.info(`[AUDIT] OLT ${olt.id}: User ${req.user?.id || 'unknown'} ${action}ed MAC ${normalizedMac} for ONU ${onu.serialNumber}`);

        return res.json({ 
            success: true, 
            message: `MAC address ${normalizedMac} ${action.toLowerCase()}ed successfully`,
            output 
        });
    } catch (error) {
        logger.error(`[DEVICE BLOCK ERROR] ${error.message}`);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
};