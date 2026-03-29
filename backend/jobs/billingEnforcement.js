const MikroTikService = require('../services/mikrotikService');
const logger = require('../utils/logger');

async function enforceBilling(users, device) {
  const mikro = new MikroTikService(device);
  const results = [];

  try {
    await mikro.connect();

    for (const user of users) {
      if (user.invoice_status === 'UNPAID') {
        try {
          await mikro.channel.write([
            '/ppp/secret/set',
            `=numbers=${user.username}`,
            '=disabled=yes'
          ]);

          logger.info(`🚨 Auto-Disconnected Unpaid User: ${user.username}`);
          results.push({ username: user.username, status: 'DISCONNECTED' });
        } catch (err) {
          logger.error(`🚨 Failed to disconnect User ${user.username}: ${err.message}`);
          results.push({ username: user.username, status: 'FAILED', error: err.message });
        }
      }
    }
  } catch (err) {
    logger.error('Mikrotik Connection Failed for Billing Enforcement:', err.message);
  } finally {
    await mikro.disconnect();
  }
  
  return results;
}

module.exports = enforceBilling;
