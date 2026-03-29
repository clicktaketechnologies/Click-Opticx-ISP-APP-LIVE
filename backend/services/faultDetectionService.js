const redis = require('./redisService');
const logger = require('../utils/logger');

class FaultDetection {

  static async detect(onuList, io) {
    const alerts = [];

    for (const onu of onuList) {
      if (onu.status === 'LOS') {
        alerts.push(this.raise('FIBER_CUT', onu, io));
      }

      if (onu.offline_duration > 300) {
        alerts.push(this.raise('ONU_OFFLINE', onu, io));
      }

      try {
        const prevKeys = await redis.keys(`signal:*:*${onu.id}*`);
        // Basic check if any previous signal matches this id
        let prevDbm = null;
        if(prevKeys.length > 0) {
           const prev = await redis.get(prevKeys[0]);
           if (prev) {
             const parsed = JSON.parse(prev);
             prevDbm = parsed.dbm;
           }
        } else {
           const prev = await redis.get(`signal:${onu.id}`);
           if (prev) {
             const parsed = JSON.parse(prev);
             prevDbm = parsed.dbm;
           }
        }

        if (prevDbm !== null && onu.dbm !== undefined) {
          if (Math.abs(prevDbm - onu.dbm) > 5) {
            alerts.push(this.raise('SIGNAL_FLUCTUATION', onu, io));
          }
        }
      } catch (err) { }
    }
    
    return alerts.filter(a => a);
  }

  static raise(type, onu, io) {
    logger.warn(`⚠️ ${type} detected on ONU ${onu.id || onu.serial}`);
    
    const alertData = {
      type,
      onu: onu.id || onu.serial,
      timestamp: Date.now()
    };
    
    if (io) {
      // Broadcast to global admins
      io.to('admin_dashboard').emit('fault-alert', alertData);
      
      // Broadcast to specific user room if they are watching their ONU
      io.to(onu.id || onu.serial).emit('fault-alert', alertData);
    }
    
    return alertData;
  }
}

module.exports = FaultDetection;
