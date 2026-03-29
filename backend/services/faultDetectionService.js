const logger = require('../utils/logger');
const admin = require('firebase-admin');
const axios = require('axios');

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
      message: this.getMessageForType(type, onu),
      onu: onu.id || onu.serial,
      severity: this.getSeverity(type),
      timestamp: Date.now()
    };
    
    if (io) {
      // Broadcast to global admins
      io.to('admin_dashboard').emit('fault-alert', alertData);
      
      // Broadcast to specific user room if they are watching their ONU
      io.to(onu.id || onu.serial).emit('fault-alert', alertData);
    }

    // Trigger FCM Push if subscriber has a token
    if (onu.fcmToken && admin.apps.length) {
        this.sendPush(onu.fcmToken, alertData);
    }
    
    return alertData;
  }

  static getMessageForType(type, onu) {
      switch(type) {
          case 'FIBER_CUT': return `CRITICAL: Fiber cut detected at your location. Our team is on the way.`;
          case 'ONU_OFFLINE': return `Your device went offline. Please check your power supply.`;
          case 'SIGNAL_FLUCTUATION': return `We detected a signal fluctuation. Connectivity might be unstable.`;
          default: return `Network alert detected on your line.`;
      }
  }

  static getSeverity(type) {
      return type === 'FIBER_CUT' ? 'Critical' : 'Warning';
  }

  static async sendPush(token, alert) {
      try {
          const message = {
              notification: {
                  title: 'ISP Network Alert',
                  body: alert.message
              },
              data: {
                  type: alert.type,
                  onu: alert.onu,
                  click_action: 'FLUTTER_NOTIFICATION_CLICK'
              },
              token: token
          };
          await admin.messaging().send(message);
          logger.info(`[PUSH-AUTO] Alert sent to subscriber: ${alert.type}`);
      } catch (e) {
          logger.error(`[PUSH-AUTO] Failed to send: ${e.message}`);
      }
  }
}

module.exports = FaultDetection;
