const snmp = require('net-snmp');
const logger = require('../utils/logger');

// SNMP OIDs for interface statistics
const OIDS = {
    ifInOctets: '1.3.6.1.2.1.2.2.1.10',    // Incoming bytes
    ifOutOctets: '1.3.6.1.2.1.2.2.1.16',   // Outgoing bytes
    ifSpeed: '1.3.6.1.2.1.2.2.1.5'         // Interface speed
};

// Store previous values for delta calculation
const telemetryCache = new Map();

// Real-time Bandwidth Monitoring via SNMP
exports.streamBandwidth = (socket, userId) => {
    // In production, fetch device IP from user's assigned device
    // For now, using placeholder logic
    const deviceIp = '192.168.1.1'; // Replace with actual device lookup
    const interfaceIndex = 1; // Replace with actual interface

    logger.info(`Starting bandwidth stream for user ${userId} on ${deviceIp}`);

    const session = snmp.createSession(deviceIp, 'public', {
        version: snmp.Version2c,
        timeout: 5000
    });

    const oids = [
        `${OIDS.ifInOctets}.${interfaceIndex}`,
        `${OIDS.ifOutOctets}.${interfaceIndex}`
    ];

    let lastInOctets = 0;
    let lastOutOctets = 0;
    let lastTimestamp = Date.now();

    // Initialize cache
    if (!telemetryCache.has(userId)) {
        telemetryCache.set(userId, { lastInOctets: 0, lastOutOctets: 0 });
    }

    const interval = setInterval(() => {
        session.get(oids, (error, varbinds) => {
            if (error) {
                logger.error(`SNMP error for user ${userId}: ${error.message}`);
                socket.emit('bandwidth-error', {
                    message: 'Failed to fetch bandwidth data',
                    error: error.message
                });
                return;
            }

            try {
                const inOctets = parseInt(varbinds[0].value);
                const outOctets = parseInt(varbinds[1].value);
                const currentTimestamp = Date.now();

                // Calculate delta
                const timeDelta = (currentTimestamp - lastTimestamp) / 1000; // seconds
                const inDelta = inOctets - lastInOctets;
                const outDelta = outOctets - lastOutOctets;

                // Calculate speed in Mbps
                const downloadSpeed = ((inDelta * 8) / (timeDelta * 1000000)).toFixed(2);
                const uploadSpeed = ((outDelta * 8) / (timeDelta * 1000000)).toFixed(2);

                // Update cache
                lastInOctets = inOctets;
                lastOutOctets = outOctets;
                lastTimestamp = currentTimestamp;

                // Emit to client
                socket.emit('bandwidth-update', {
                    download: parseFloat(downloadSpeed),
                    upload: parseFloat(uploadSpeed),
                    timestamp: currentTimestamp,
                    totalDownload: (inOctets / 1000000000).toFixed(2), // GB
                    totalUpload: (outOctets / 1000000000).toFixed(2)   // GB
                });

            } catch (err) {
                logger.error(`Error processing SNMP data: ${err.message}`);
            }
        });
    }, 2000); // Poll every 2 seconds

    // Cleanup on disconnect
    socket.on('disconnect', () => {
        logger.info(`Stopping bandwidth stream for user ${userId}`);
        clearInterval(interval);
        session.close();
        telemetryCache.delete(userId);
    });
};

// Get device statistics (one-time fetch)
exports.getDeviceStats = async (deviceIp, interfaceIndex = 1) => {
    return new Promise((resolve, reject) => {
        const session = snmp.createSession(deviceIp, 'public');

        const oids = [
            `${OIDS.ifInOctets}.${interfaceIndex}`,
            `${OIDS.ifOutOctets}.${interfaceIndex}`,
            `${OIDS.ifSpeed}.${interfaceIndex}`
        ];

        session.get(oids, (error, varbinds) => {
            session.close();

            if (error) {
                reject(error);
                return;
            }

            resolve({
                totalInOctets: parseInt(varbinds[0].value),
                totalOutOctets: parseInt(varbinds[1].value),
                interfaceSpeed: parseInt(varbinds[2].value),
                timestamp: Date.now()
            });
        });
    });
};

module.exports = exports;
