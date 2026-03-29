const redis = require('./redisService');
const OLTService = require('./oltService');
const logger = require('../utils/logger');

class SignalMonitor {

  static async checkSignals(device) {
    try {
      const olt = new OLTService(device);
      const raw = await olt.execute('show gpon onu optical-info');
      const parsed = this.parse(raw);

      for (const onu of parsed) {
        if (!onu.id) continue;
        const key = `signal:${onu.id}`;
        await redis.set(key, JSON.stringify(onu), 'EX', 20);

        if (onu.dbm < -28) {
          this.triggerAlert(onu, 'CRITICAL');
        } else if (onu.dbm < -25) {
          this.triggerAlert(onu, 'WEAK');
        }
      }
      return parsed;
    } catch (err) {
      logger.error('Signal Monitor Error:', err);
      return [];
    }
  }

  static parse(data) {
    // This is a naive parser. For full production, use regex exactly matching the OLT brand
    return data.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.includes(' '))
      .map(line => {
        const parts = line.split(/\s+/);
        // Assuming column 0 = id, column 3 = dbm, etc. depending on format
        const id = parts[0];
        const dbmStr = parts.find(p => p.includes('.') || p.includes('-'));
        const dbm = parseFloat(dbmStr || '0');
        return {
          id: id,
          dbm: isNaN(dbm) ? 0 : dbm
        };
      }).filter(onu => onu.dbm !== 0);
  }

  static triggerAlert(onu, level) {
    // We log it here. The actual socket emission will be picked up by the automation runner
    logger.warn(`🚨 ${level} SIGNAL: ${onu.id} = ${onu.dbm} dBm`);
  }
}

module.exports = SignalMonitor;
