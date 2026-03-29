const ONUDiscoveryService = require('../services/onuDiscoveryService');
const SignalMonitor = require('../services/signalMonitorService');
const FaultDetection = require('../services/faultDetectionService');
const logger = require('../utils/logger');

class OLTHealthAutomator {
  constructor(io) {
    this.io = io;
    this.intervalId = null;
    this.devices = []; // Registry of OLT nodes
    this.isRunning = false;
  }

  updateRegistry(newDevices) {
    this.devices = Array.isArray(newDevices) ? newDevices : [];
    logger.info(`[AUTOMATOR] Registry updated: ${this.devices.length} OLT nodes`);
    if (this.devices.length > 0 && !this.isRunning) {
        this.start();
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    logger.info(`[AUTOMATOR] Global ISP Health Loop Started`);

    this.intervalId = setInterval(async () => {
      try {
        await this.runCycle();
      } catch (err) {
        logger.error(`[AUTOMATOR] Cycle Error: ${err.message}`);
      }
    }, 45000); // 45s cycle to be safe with SSH concurrency
    
    this.runCycle();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    logger.info(`[AUTOMATOR] Global ISP Health Loop Stopped`);
  }

  async runCycle() {
    if (this.devices.length === 0) return;
    logger.debug(`[AUTOMATOR] Cycling through ${this.devices.length} OLTs...`);

    for (const device of this.devices) {
      try {
        // 1. Get Unconfigured ONUs (Discovery)
        const unconfigured = await ONUDiscoveryService.getUnconfiguredONUs(device);
        if (unconfigured.length > 0 && this.io) {
          this.io.to('admin_dashboard').emit('discovery', { 
            oltId: device.id, 
            oltName: device.name, 
            onus: unconfigured 
          });
        }

        // 2. Poll the Signals (Monitoring)
        const signalNodes = await SignalMonitor.checkSignals(device);

        // 3. Process AI Faults (Fault Detection)
        if (signalNodes.length > 0) {
          await FaultDetection.detect(signalNodes, this.io);
        }

        // 4. Update OLT itself status
        this.io.emit('olt-status-update', { id: device.id, status: 'Online', connectionStatus: 'Connected' });

      } catch (e) {
        logger.error(`[AUTOMATOR] Failed to check OLT ${device.name}:`, e.message);
        this.io.emit('olt-status-update', { id: device.id, status: 'Offline', connectionStatus: 'Failed', lastError: e.message });
      }
    }
  }
}

module.exports = OLTHealthAutomator;
