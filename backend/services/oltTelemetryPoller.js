// OLT Telemetry Poller Service
// Polls OLTs for telemetry data, caches in Redis, persists to TimescaleDB, broadcasts via WebSocket

import OLTAdapterFactory from './oltAdapterFactory.js';
import redisService from './redisService.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const POLLING_INTERVAL_MS = 5000; // 5 seconds as specified in requirements
const REDIS_TTL_SECONDS = 30; // Cache telemetry data for 30 seconds
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 1000; // Start with 1 second, exponential backoff

class OLTTelemetryPoller {
  constructor(io) {
    this.io = io;
    this.pollingIntervals = new Map(); // oltId -> intervalId
    this.retries = new Map(); // oltId -> retry count
    this.isRunning = false;
    
    // Bind methods
    this.pollOLT = this.pollOLT.bind(this);
    this.handlePollError = this.handlePollError.bind(this);
  }

  /**
   * Start polling for a specific OLT
   * @param {Object} olt - OLT device object
   */
  startPollingOLT(olt) {
    if (this.pollingIntervals.has(olt.id)) {
      logger.warn(`[TELEMETRY POLLER] Already polling OLT ${olt.id}`);
      return;
    }

    logger.info(`[TELEMETRY POLLER] Starting polling for OLT ${olt.id} (${olt.ip})`);
    
    // Reset retry count for this OLT
    this.retries.set(olt.id, 0);
    
    // Start polling interval
    const intervalId = setInterval(
      () => this.pollOLT(olt),
      POLLING_INTERVAL_MS
    );
    
    this.pollingIntervals.set(olt.id, intervalId);
    
    // Run immediately on start
    this.pollOLT(olt);
  }

  /**
   * Stop polling for a specific OLT
   * @param {string} oltId - OLT ID
   */
  stopPollingOLT(oltId) {
    const intervalId = this.pollingIntervals.get(oltId);
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(oltId);
      this.retries.delete(oltId);
      logger.info(`[TELEMETRY POLLER] Stopped polling for OLT ${oltId}`);
    }
  }

  /**
   * Start polling for all OLTs in the registry
   * @param {Array} olts - Array of OLT objects
   */
  startPollingAll(olts) {
    if (this.isRunning) {
      logger.warn('[TELEMETRY POLLER] Poller already running');
      return;
    }
    
    logger.info(`[TELEMETRY POLLER] Starting polling for ${olts.length} OLTs`);
    this.isRunning = true;
    
    olts.forEach(olt => {
      this.startPollingOLT(olt);
    });
  }

  /**
   * Stop polling for all OLTs
   */
  stopPollingAll() {
    logger.info('[TELEMETRY POLLER] Stopping all OLT polling');
    this.isRunning = false;
    
    this.pollingIntervals.forEach((intervalId, oltId) => {
      clearInterval(intervalId);
      logger.info(`[TELEMETRY POLLER] Stopped polling for OLT ${oltId}`);
    });
    
    this.pollingIntervals.clear();
    this.retries.clear();
  }

  /**
   * Poll a single OLT for telemetry data
   * @param {Object} olt - OLT device object
   */
  async pollOLT(olt) {
    const oltId = olt.id;
    let retryCount = this.retries.get(olt.id) || 0;
    
    try {
      logger.debug(`[TELEMETRY POLLER] Polling OLT ${oltId} (attempt ${retryCount + 1})`);
      
      // Create adapter based on OLT access type
      const adapter = OLTAdapterFactory.createAdapter(olt);
      
      // Connect to OLT
      await adapter.connect();
      
      // Collect telemetry data
      const telemetryData = await this.collectTelemetryData(olt, adapter);
      
      // Reset retry count on success
      this.retries.set(oltId, 0);
      
      // Cache in Redis
      await this.cacheTelemetryData(oltId, telemetryData);
      
      // Persist to TimescaleDB (would be implemented with actual DB connection)
      await this.persistTelemetryData(oltId, telemetryData);
      
      // Broadcast via WebSocket
      await this.broadcastTelemetryData(oltId, telemetryData);
      
      // Update OLT status in database/cache
      await this.updateOLTStatus(oltId, {
        status: 'Online',
        connectionStatus: 'Connected',
        lastCheck: new Date().toISOString()
      });
      
      // Disconnect
      await adapter.disconnect();
      
    } catch (error) {
      logger.error(`[TELEMETRY POLLER] Failed to poll OLT ${oltId}: ${error.message}`);
      
      // Increment retry count
      retryCount++;
      this.retries.set(oltId, retryCount);
      
      // Handle error with exponential backoff
      await this.handlePollError(olt, error, retryCount);
    }
  }

  /**
   * Collect telemetry data from OLT using the appropriate adapter
   * @param {Object} olt - OLT device object
   * @param {Object} adapter - Protocol adapter instance
   * @returns {Object} - Telemetry data
   */
  async collectTelemetryData(olt, adapter) {
    const timestamp = new Date().toISOString();
    const ponPorts = Array.from({ length: olt.pon_ports }, (_, i) => `${i + 1}`);
    
    // Collect data for each PON port
    const ponData = await Promise.all(
      ponPorts.map(async (ponPort) => {
        try {
          // Get ONU list for this port
          const onus = await adapter.getONUList();
          
          // Get signal/status for each ONU on this port
          const onuStatuses = await Promise.all(
            onus.map(async (onu) => {
              try {
                const signalData = await adapter.getSignal(ponPort, onu.serial || onu.id);
                return {
                  onuId: onu.id || onu.serial,
                  serialNumber: onu.serial,
                  signalStrength: signalData.signalStrength,
                  status: signalData.status,
                  opticalPower: signalData.opticalPower || signalData.signalStrength,
                  onlineTime: signalData.onlineTime || 0
                };
              } catch (onuError) {
                logger.warn(`[TELEMETRY POLLER] Failed to get status for ONU ${onu.serial}: ${onuError.message}`);
                return {
                  onuId: onu.id || onu.serial,
                  serialNumber: onu.serial,
                  signalStrength: null,
                  status: 'Unknown',
                  opticalPower: null,
                  onlineTime: 0
                };
              }
            })
          );
          
          // Get PON port level metrics
          const portMetrics = await this.getPortMetrics(olt, adapter, ponPort);
          
          return {
            ponPort,
            timestamp,
            onuCount: onus.length,
            onuOnline: onuStatuses.filter(o => o.status === 'Online').length,
            onuWarning: onuStatuses.filter(o => o.status === 'Warning').length,
            onuLos: onuStatuses.filter(o => o.status === 'LOS').length,
            rxBytes: portMetrics.rxBytes || 0,
            txBytes: portMetrics.txBytes || 0,
            rxRate: portMetrics.rxRate || 0,
            txRate: portMetrics.txRate || 0,
            latencyMs: portMetrics.latencyMs || 0,
            packetLoss: portMetrics.packetLoss || 0,
            txPower: portMetrics.txPower || 0,
            rxPower: portMetrics.rxPower || 0,
            temperature: portMetrics.temperature || 0,
            voltage: portMetrics.voltage || 0,
            los: portMetrics.los || false,
            lof: portMetrics.lof || false,
            sf: portMetrics.sf || false,
            sd: portMetrics.sd || false,
            onuDetails: onuStatuses,
            rawData: {
              rawOnuList: onus,
              rawPortMetrics: portMetrics.raw || {}
            }
          };
        } catch (portError) {
          logger.error(`[TELEMETRY POLLER] Failed to collect data for PON port ${ponPort}: ${portError.message}`);
          // Return empty data for this port to avoid failing the entire poll
          return {
            ponPort,
            timestamp,
            onuCount: 0,
            onuOnline: 0,
            onuWarning: 0,
            onuLos: 0,
            rxBytes: 0,
            txBytes: 0,
            rxRate: 0,
            txRate: 0,
            latencyMs: 0,
            packetLoss: 0,
            txPower: 0,
            rxPower: 0,
            temperature: 0,
            voltage: 0,
            los: false,
            lof: false,
            sf: false,
            sd: false,
            onuDetails: [],
            rawData: {}
          };
        }
      })
    );
    
    // Aggregate port-level data for OLT-level metrics
    const aggregated = this.aggregateTelemetryData(ponData);
    
    return {
      oltId: olt.id,
      oltName: olt.name,
      oltIp: olt.ip,
      timestamp,
      ponData: ponData,
      ...aggregated,
      rawData: {
        ponData: ponData.map(p => ({
          ponPort: p.ponPort,
          timestamp: p.timestamp,
          raw: p.rawData
        }))
      }
    };
  }

  /**
   * Get port-level metrics (would be implemented per adapter type)
   * @param {Object} olt - OLT device object
   * @param {Object} adapter - Protocol adapter instance
   * @param {string} ponPort - PON port identifier
   * @returns {Object} - Port metrics
   */
  async getPortMetrics(olt, adapter, ponPort) {
    // This would be implemented differently for each adapter type
    // For now, return basic structure - would be enhanced per vendor/adapter
    try {
      // Try to get pulse data if available
      if (typeof adapter.getPulse === 'function') {
        const pulseData = await adapter.getPulse();
        return {
          rxBytes: pulseData.rxBytes || 0,
          txBytes: pulseData.txBytes || 0,
          rxRate: pulseData.rxRate || 0,
          txRate: pulseData.txRate || 0,
          latencyMs: pulseData.latencyMs || 0,
          packetLoss: pulseData.packetLoss || 0,
          txPower: pulseData.txPower || 0,
          rxPower: pulseData.rxPower || 0,
          temperature: pulseData.temperature || 0,
          voltage: pulseData.voltage || 0,
          los: pulseData.los || false,
          lof: pulseData.lof || false,
          sf: pulseData.sf || false,
          sd: pulseData.sd || false,
          raw: pulseData.raw
        };
      }
    } catch (pulseError) {
      logger.debug(`[TELEMETRY POLLER] Pulse data not available: ${pulseError.message}`);
    }
    
    // Return default values if specific metrics unavailable
    return {
      rxBytes: 0,
      txBytes: 0,
      rxRate: 0,
      txRate: 0,
      latencyMs: 0,
      packetLoss: 0,
      txPower: 0,
      rxPower: 0,
      temperature: 0,
      voltage: 0,
      los: false,
      lof: false,
      sf: false,
      sd: false
    };
  }

  /**
   * Aggregate telemetry data across PON ports
   * @param {Array} ponData - Array of PON port telemetry data
   * @returns {Object} - Aggregated OLT-level data
   */
  aggregateTelemetryData(ponData) {
    const totalOnuCount = ponData.reduce((sum, p) => sum + p.onuCount, 0);
    const totalOnuOnline = ponData.reduce((sum, p) => sum + p.onuOnline, 0);
    const totalOnuWarning = ponData.reduce((sum, p) => sum + p.onuWarning, 0);
    const totalOnuLos = ponData.reduce((sum, p) => sum + p.onuLos, 0);
    
    // Calculate average optical power (excluding null/invalid values)
    const validRxPower = ponData
      .flatMap(p => p.onuDetails)
      .filter(o => o.opticalPower !== null && o.opticalPower !== undefined)
      .map(o => o.opticalPower);
    
    const avgOpticalPower = validRxPower.length > 0
      ? validRxPower.reduce((sum, val) => sum + val, 0) / validRxPower.length
      : 0;
    
    // Sum bandwidth
    const totalRxBytes = ponData.reduce((sum, p) => sum + p.rxBytes, 0);
    const totalTxBytes = ponData.reduce((sum, p) => sum + p.txBytes, 0);
    const totalRxRate = ponData.reduce((sum, p) => sum + p.rxRate, 0);
    const totalTxRate = ponData.reduce((sum, p) => sum + p.txRate, 0);
    
    // Determine overall status
    let status = 'Online';
    if (totalOnuLos > 0) {
      status = 'Degraded'; // Some ONUs have LOS
    } else if (totalOnuWarning > (totalOnuCount * 0.5)) {
      status = 'Degraded'; // More than 50% of ONUs warning
    }
    
    return {
      onuCount: totalOnuCount,
      onuOnline: totalOnuOnline,
      onuWarning: totalOnuWarning,
      onuLos: totalOnuLos,
      bandwidthRx: totalRxBytes,
      bandwidthTx: totalTxBytes,
      bandwidthRxRate: totalRxRate,
      bandwidthTxRate: totalTxRate,
      opticalAvg: avgOpticalPower,
      status
    };
  }

  /**
   * Cache telemetry data in Redis
   * @param {string} oltId - OLT ID
   * @param {Object} telemetryData - Telemetry data to cache
   */
  async cacheTelemetryData(oltId, telemetryData) {
    try {
      const key = `olt_telemetry:${oltId}`;
      await redisService.set(
        key, 
        JSON.stringify(telemetryData), 
        'EX', 
        REDIS_TTL_SECONDS
      );
      
      logger.debug(`[TELEMETRY POLLER] Cached telemetry for OLT ${oltId}`);
    } catch (error) {
      logger.error(`[TELEMETRY POLLER] Failed to cache telemetry for OLT ${oltId}: ${error.message}`);
      // Don't throw - we can still persist and broadcast
    }
  }

  /**
   * Persist telemetry data to TimescaleDB
   * @param {string} oltId - OLT ID
   * @param {Object} telemetryData - Telemetry data to persist
   */
  async persistTelemetryData(oltId, telemetryData) {
    // This would be implemented with actual TimescaleDB connection
    // For now, we'll log that we would persist
    logger.debug(`[TELEMETRY POLLER] Would persist telemetry for OLT ${oltId} to TimescaleDB`);
    
    // In a real implementation, we would:
    // 1. Connect to TimescaleDB (via Supabase or direct connection)
    // 2. Insert data into olt_telemetry table for each PON port
    // 3. Handle any database errors appropriately
    
    // Example of what the implementation would look like:
    /*
    try {
      const db = await getTimescaleDBConnection();
      
      // Insert data for each PON port
      const insertPromises = telemetryData.ponData.map(portData => {
        return db.query(`
          INSERT INTO olt_telemetry (
            olt_id, timestamp, pon_port, 
            rx_bytes, tx_bytes, rx_rate, tx_rate,
            latency_ms, packet_loss,
            tx_power, rx_power, tx_current, rx_current, temperature, voltage,
            los, lof, sf, sd,
            onu_active, onu_total, onu_warning, onu_los,
            raw_data
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        `, [
          oltId,
          portData.timestamp,
          portData.ponPort,
          portData.rxBytes,
          portData.txBytes,
          portData.rxRate,
          portData.txRate,
          portData.latencyMs,
          portData.packetLoss,
          portData.txPower,
          portData.rxPower,
          0, // tx_current - would come from actual metrics
          0, // rx_current - would come from actual metrics
          portData.temperature,
          portData.voltage,
          portData.los,
          portData.lof,
          portData.sf,
          portData.sd,
          portData.onuOnline, // onu_active
          portData.onuCount,  // onu_total
          portData.onuWarning,
          portData.onuLos,
          JSON.stringify(portData.rawData)
        ]);
      });
      
      await Promise.all(insertPromises);
      logger.debug(`[TELEMETRY POLLER] Persisted telemetry for OLT ${oltId} to TimescaleDB`);
    } catch (dbError) {
      logger.error(`[TELEMETRY POLLER] Failed to persist telemetry for OLT ${oltId}: ${dbError.message}`);
      // Depending on requirements, we might want to throw or handle differently
    }
    */
  }

  /**
   * Broadcast telemetry data via WebSocket
   * @param {string} oltId - OLT ID
   * @param {Object} telemetryData - Telemetry data to broadcast
   */
  async broadcastTelemetryData(oltId, telemetryData) {
    if (!this.io) {
      logger.warn(`[TELEMETRY POLLER] No WebSocket instance available for broadcasting`);
      return;
    }
    
    try {
      // Broadcast to OLT-specific room
      const oltRoom = `olt_${oltId}`;
      this.io.to(oltRoom).emit('olt_telemetry_update', {
        oltId,
        timestamp: telemetryData.timestamp,
        status: telemetryData.status,
        onuCount: telemetryData.onuCount,
        onuOnline: telemetryData.onuOnline,
        onuWarning: telemetryData.onuWarning,
        onuLos: telemetryData.onuLos,
        bandwidthRx: telemetryData.bandwidthRx,
        bandwidthTx: telemetryData.bandwidthTx,
        opticalAvg: telemetryData.opticalAvg,
        ponData: telemetryData.ponData.map(p => ({
          ponPort: p.ponPort,
          onuCount: p.onuCount,
          onuOnline: p.onuOnline,
          onuWarning: p.onuWarning,
          onuLos: p.onuLos,
          rxBytes: p.rxBytes,
          txBytes: p.txBytes,
          rxRate: p.rxRate,
          txRate: p.txRate,
          latencyMs: p.latencyMs,
          packetLoss: p.packetLoss,
          txPower: p.txPower,
          rxPower: p.rxPower,
          los: p.los,
          lof: p.lof,
          sf: p.sf,
          sd: p.sd
        }))
      });
      
      // Also broadcast to any subscribed ONU rooms for detailed data
      telemetryData.ponData.forEach(portData => {
        portData.onuDetails.forEach(onu => {
          if (onu.onuId) {
            const onuRoom = `onu_${onu.onuId}`;
            this.io.to(onuRoom).emit('onu_telemetry_update', {
              onuId: onu.onuId,
              serialNumber: onu.serialNumber,
              signalStrength: onu.signalStrength,
              status: onu.status,
              opticalPower: onu.opticalPower,
              onlineTime: onu.onlineTime,
              timestamp: telemetryData.timestamp
            });
          }
        });
      });
      
      logger.debug(`[TELEMETRY POLLER] Broadcasted telemetry for OLT ${oltId}`);
    } catch (error) {
      logger.error(`[TELEMETRY POLLER] Failed to broadcast telemetry for OLT ${oltId}: ${error.message}`);
    }
  }

  /**
   * Update OLT status in database/cache
   * @param {string} oltId - OLT ID
   * @param {Object} statusData - Status data to update
   */
  async updateOLTStatus(oltId, statusData) {
    try {
      // Update in-memory state if available (would integrate with db.ts)
      logger.debug(`[TELEMETRY POLLER] Would update OLT ${oltId} status: ${JSON.stringify(statusData)}`);
      
      // In real implementation, this would update the database
      // For example, via db.ts methods or direct SQL
      
      // Also update Redis cache for quick access
      const statusKey = `olt_status:${oltId}`;
      await redisService.set(
        statusKey,
        JSON.stringify({
          ...statusData,
          updatedAt: new Date().toISOString()
        }),
        'EX',
        60 // Status cached for 60 seconds
      );
    } catch (error) {
      logger.error(`[TELEMETRY POLLER] Failed to update status for OLT ${oltId}: ${error.message}`);
    }
  }

  /**
   * Handle polling errors with exponential backoff
   * @param {Object} olt - OLT device object
   * @param {Error} error - The error that occurred
   * @param {number} retryCount - Current retry count
   */
  async handlePollError(olt, error, retryCount) {
    const oltId = olt.id;
    const maxRetries = MAX_RETRIES;
    
    // Update OLT status to reflect the error
    await this.updateOLTStatus(oltId, {
      status: 'Offline',
      connectionStatus: 'Failed',
      lastError: error.message,
      lastCheck: new Date().toISOString()
    });
    
    // If we've exceeded max retries, stop polling and alert
    if (retryCount >= maxRetries) {
      logger.error(`[TELEMETRY POLLER] Max retries exceeded for OLT ${oltId}. Stopping polling.`);
      
      // Stop polling for this OLT
      this.stopPollingOLT(oltId);
      
      // Alert administrators (would integrate with alerting system)
      logger.error(`[TELEMETRY POLLER] ALERT: OLT ${oltId} (${olt.ip}) appears to be permanently unreachable`);
      
      // Broadcast failure status
      if (this.io) {
        this.io.to(`olt_${oltId}`).emit('olt_telemetry_update', {
          oltId,
          timestamp: new Date().toISOString(),
          status: 'Offline',
          connectionStatus: 'Failed',
          error: error.message,
          onuCount: 0,
          onuOnline: 0,
          onuWarning: 0,
          onuLos: 0,
          bandwidthRx: 0,
          bandwidthTx: 0,
          opticalAvg: 0,
          ponData: []
        });
      }
      
      return;
    }
    
    // Calculate backoff delay with jitter
    // Exponential backoff: base * (2^retryCount) + random jitter
    const baseDelay = RETRY_BACKOFF_MS;
    const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
    const jitter = Math.random() * 1000; // 0-1000ms random jitter
    const delayMs = Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
    
    logger.warn(`[TELEMETRY POLLER] Retrying OLT ${oltId} in ${delayMs}ms (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Schedule retry after delay
    setTimeout(() => {
      // Only retry if we're still supposed to be polling this OLT
      if (this.pollingIntervals.has(oltId)) {
        this.pollOLT(olt);
      }
    }, delayMs);
  }

  /**
   * Get current polling status for monitoring
   * @returns {Object} - Polling status information
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      pollingCount: this.pollingIntervals.size,
      pollingOLTs: Array.from(this.pollingIntervals.keys()),
      retryCounts: Object.fromEntries(this.retries)
    };
  }
}

export default OLTTelemetryPoller;