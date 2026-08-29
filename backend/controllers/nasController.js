import RouterOSAPI from 'node-routeros';
import logger from '../utils/logger.js';

// ─── Helper: open a MikroTik API connection ───────────────────────────────────
async function openMikrotikApi({ ip, apiPort = 8728, apiUsername = 'admin', apiPassword = '' }) {
    const api = new RouterOSAPI({
        host: ip,
        user: apiUsername,
        password: apiPassword,
        port: parseInt(apiPort),
        timeout: 8
    });
    await api.connect();
    return api;
}

// ─── Helper: close safely ─────────────────────────────────────────────────────
async function closeApi(api) {
    try { await api.disconnect(); } catch (_) {}
}

// ─── PPPoE User Sync ──────────────────────────────────────────────────────────
// POST /api/nas/sync
export const syncSubscriber = async (req, res) => {
    const { nas, user, action = 'upsert' } = req.body;

    if (!nas || !user) {
        return res.status(400).json({ success: false, message: 'Missing nas or user payload' });
    }

    if (!nas.ip || !nas.apiUsername) {
        return res.status(400).json({ success: false, message: 'NAS missing IP or credentials' });
    }

    const connectionType = user.nasConnectionType || 'PPPoE';

    let api;
    try {
        if (nas.apiEnabled === false) {
            return res.status(400).json({ success: false, message: 'API is disabled for this NAS node. Please enable API in Router Settings.' });
        }
        api = await openMikrotikApi(nas);

        if (connectionType === 'PPPoE') {
            await syncPPPoE(api, user, action, nas);
        } else if (connectionType === 'Hotspot') {
            await syncHotspot(api, user, action);
        } else {
            await closeApi(api);
            return res.json({ success: true, message: `Connection type ${connectionType} does not require NAS sync.` });
        }

        await closeApi(api);
        logger.info(`[NAS SYNC] ${action} subscriber ${user.username || user.connectionId} on ${nas.name}`);
        return res.json({ success: true, message: `Subscriber ${action} completed on ${nas.name}` });

    } catch (error) {
        if (api) await closeApi(api);
        logger.error(`[NAS SYNC ERROR] ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
};

async function syncPPPoE(api, user, action, nas) {
    const username = user.username || user.connectionId;
    const password = user.password || 'changeme';
    const profile = user.packageName || 'default';

    // Find existing secret
    const secrets = await api.write('/ppp/secret/print', [`?name=${username}`]);

    if (action === 'remove') {
        if (secrets.length > 0) {
            await api.write('/ppp/secret/remove', [`=.id=${secrets[0]['.id']}`]);
        }
        return;
    }

    if (secrets.length > 0) {
        // Update existing
        await api.write('/ppp/secret/set', [
            `=.id=${secrets[0]['.id']}`,
            `=password=${password}`,
            `=profile=${profile}`,
            `=comment=CO-CRM:${user.id}`
        ]);
    } else {
        // Create new
        await api.write('/ppp/secret/add', [
            `=name=${username}`,
            `=password=${password}`,
            `=service=pppoe`,
            `=profile=${profile}`,
            `=comment=CO-CRM:${user.id}`
        ]);
    }
}

async function syncHotspot(api, user, action) {
    const username = user.username || user.connectionId;
    const password = user.password || 'changeme';
    const profile = user.packageName || 'default';

    const users = await api.write('/ip/hotspot/user/print', [`?name=${username}`]);

    if (action === 'remove') {
        if (users.length > 0) {
            await api.write('/ip/hotspot/user/remove', [`=.id=${users[0]['.id']}`]);
        }
        return;
    }

    if (users.length > 0) {
        await api.write('/ip/hotspot/user/set', [
            `=.id=${users[0]['.id']}`,
            `=password=${password}`,
            `=profile=${profile}`,
            `=comment=CO-CRM:${user.id}`
        ]);
    } else {
        await api.write('/ip/hotspot/user/add', [
            `=name=${username}`,
            `=password=${password}`,
            `=profile=${profile}`,
            `=comment=CO-CRM:${user.id}`
        ]);
    }
}

// ─── CoA / Disconnect ─────────────────────────────────────────────────────────
// POST /api/nas/coa
export const executeCoA = async (req, res) => {
    const { nas, user, action } = req.body;

    if (!nas || !user || !action) {
        return res.status(400).json({ success: false, message: 'Missing nas, user, or action' });
    }

    let api;
    try {
        if (nas.apiEnabled === false) {
            return res.status(400).json({ success: false, message: 'API is disabled for this NAS node. Disconnect command requires API access.' });
        }
        api = await openMikrotikApi(nas);

        const username = user.username || user.connectionId;
        const connectionType = user.nasConnectionType || 'PPPoE';

        if (action === 'Disconnect') {
            // Kill active PPPoE/DHCP sessions
            if (connectionType === 'PPPoE') {
                const activeSessions = await api.write('/ppp/active/print', [`?name=${username}`]);
                for (const session of activeSessions) {
                    await api.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
                }
                logger.info(`[CoA] Disconnected PPPoE session for ${username}`);
            } else if (connectionType === 'Hotspot') {
                const activeSessions = await api.write('/ip/hotspot/active/print', [`?user=${username}`]);
                for (const session of activeSessions) {
                    await api.write('/ip/hotspot/active/remove', [`=.id=${session['.id']}`]);
                }
                logger.info(`[CoA] Disconnected Hotspot session for ${username}`);
            }
        } else if (action === 'SpeedChange') {
            // Profile change is handled via syncSubscriber - just kick the session
            if (connectionType === 'PPPoE') {
                const activeSessions = await api.write('/ppp/active/print', [`?name=${username}`]);
                for (const session of activeSessions) {
                    await api.write('/ppp/active/remove', [`=.id=${session['.id']}`]);
                }
            }
            logger.info(`[CoA] Speed change session reset for ${username}`);
        }

        await closeApi(api);
        return res.json({ success: true, message: `CoA ${action} executed for ${username}` });

    } catch (error) {
        if (api) await closeApi(api);
        logger.error(`[CoA ERROR] ${error.message}`);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// ─── Router Health / Stats ────────────────────────────────────────────────────
// GET /api/nas/:nasId/stats
export const getNasStats = async (req, res) => {
    const { ip, port, apiUsername, apiPassword } = req.query;

    if (!ip) {
        return res.status(400).json({ success: false, message: 'NAS IP required' });
    }

    let api;
    try {
        if (req.query.apiEnabled === 'false') {
             return res.status(400).json({ success: false, message: 'API is disabled' });
        }
        api = await openMikrotikApi({
            ip,
            apiPort: port || 8728,
            apiUsername: apiUsername || 'admin',
            apiPassword: apiPassword || ''
        });

        const [resources, identity, activePPPoE, activeHotspot] = await Promise.all([
            api.write('/system/resource/print'),
            api.write('/system/identity/print'),
            api.write('/ppp/active/print'),
            api.write('/ip/hotspot/active/print').catch(() => [])
        ]);

        await closeApi(api);

        const res_data = resources[0] || {};
        const uptimeStr = res_data['uptime'] || '0s';

        return res.json({
            success: true,
            status: 'Online',
            identity: identity[0]?.name || ip,
            uptime: uptimeStr,
            cpu: parseInt(res_data['cpu-load'] || '0'),
            memUsed: parseInt(res_data['total-memory'] || '0') - parseInt(res_data['free-memory'] || '0'),
            memTotal: parseInt(res_data['total-memory'] || '0'),
            activeSessions: activePPPoE.length + activeHotspot.length,
            activePPPoE: activePPPoE.length,
            activeHotspot: activeHotspot.length,
            version: res_data['version'] || 'unknown',
            platform: res_data['platform'] || 'MikroTik',
            board: res_data['board-name'] || 'RouterOS'
        });

    } catch (error) {
        if (api) await closeApi(api);
        logger.error(`[NAS STATS ERROR] ${error.message}`);
        return res.status(500).json({
            success: false,
            status: 'Offline',
            message: error.message
        });
    }
};

// ─── Full Router Health Check ─────────────────────────────────────────────────
// POST /api/nas/health
export const checkHealth = async (req, res) => {
    const { nas } = req.body;

    if (!nas || !nas.ip) {
        return res.status(400).json({ success: false, message: 'NAS payload required' });
    }

    let api;
    let radiusStatus = 'Unknown';
    let apiStatus = 'Failed';
    let coaStatus = nas.coaEnabled ? 'Enabled' : 'Disabled';

    try {
        if (nas.apiEnabled === false) {
            apiStatus = 'Disabled';
            radiusStatus = 'Disabled (Needs API)';
        } else {
            api = await openMikrotikApi(nas);

            // Get identity to confirm API works
            await api.write('/system/identity/print');
            apiStatus = 'Connected';

            // Check RADIUS client config
            const radiusClients = await api.write('/radius/print').catch(() => null);
            if (radiusClients && radiusClients.length > 0) {
                radiusStatus = 'Connected';
            } else {
                radiusStatus = 'Not Configured';
            }

            await closeApi(api);
        }

        logger.info(`[HEALTH CHECK] ${nas.name} (${nas.ip}) - API: ${apiStatus}, RADIUS: ${radiusStatus}`);

        return res.json({
            success: true,
            status: 'Online',
            api: apiStatus,
            radius: radiusStatus,
            coa: coaStatus
        });

    } catch (error) {
        if (api) await closeApi(api);
        logger.warn(`[HEALTH CHECK FAILED] ${nas.name} (${nas.ip}): ${error.message}`);

        return res.json({
            success: false,
            status: 'Offline',
            api: 'Failed',
            radius: 'Failed',
            coa: coaStatus,
            error: error.message
        });
    }
};


