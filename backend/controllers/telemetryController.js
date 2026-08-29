import snmp from 'net-snmp';
import logger from '../utils/logger.js';
import configManager from '../services/config-manager.js';

// SNMP OIDs for interface statistics
const OIDS = {
    ifInOctets: '1.3.6.1.2.1.2.2.1.10',    // Incoming bytes
    ifOutOctets: '1.3.6.1.2.1.2.2.1.16',   // Outgoing bytes
    ifSpeed: '1.3.6.1.2.1.2.2.1.5'         // Interface speed
};

// Store previous values for delta calculation
const telemetryCache = new Map();

// Real-time Bandwidth Monitoring via SNMP
export const streamBandwidth = async (socket, userId) => {
    const supabase = configManager.getSupabaseClient();
    let deviceIp = '192.168.1.1'; // Robust fallback
    let interfaceIndex = 1;

    try {
        if (supabase) {
            // Retrieve subscriber's connection parameters
            const { data: user, error } = await supabase
                .from('users')
                .select('raw_data, area, connection_type')
                .eq('id', userId)
                .single();

            if (user && !error) {
                // If the user's raw_data or connection mapping defines a target IP/nas
                if (user.raw_data && user.raw_data.deviceIp) {
                    deviceIp = user.raw_data.deviceIp;
                } else {
                    // Try to fetch active NAS IP from global system configs
                    const networkConfigs = configManager.getConfig('network_providers');
                    if (networkConfigs && networkConfigs.mikrotik && networkConfigs.mikrotik.ip) {
                        deviceIp = networkConfigs.mikrotik.ip;
                    }
                }
                
                if (user.raw_data && user.raw_data.interfaceIndex) {
                    interfaceIndex = parseInt(user.raw_data.interfaceIndex) || 1;
                }
            }
        }
    } catch (dbErr) {
        logger.error(`[TELEMETRY] Database device lookup failed: ${dbErr.message}`);
    }

    logger.info(`Starting bandwidth stream for user ${userId} on ${deviceIp} interface ${interfaceIndex}`);

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
export const getDeviceStats = async (deviceIp, interfaceIndex = 1) => {
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

export default {
    streamBandwidth,
    getDeviceStats
};
