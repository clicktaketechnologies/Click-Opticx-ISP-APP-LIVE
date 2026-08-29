/**
 * DeviceConnectorService.js
 * 
 * Handles multi-protocol connections to ISP network hardware including OLTs,
 * BRAS/BNG routers (MikroTik, Juniper), and switches.
 * 
 * Supported Protocols: SNMP v2c/v3, SSH2, MikroTik RouterOS API
 */

const snmp = require('net-snmp');
const { Client } = require('ssh2');
const { RouterOSAPI } = require('node-routeros');
const logger = require('../utils/logger'); // Assuming existing logger

class DeviceConnectorService {
  constructor() {
    this.connections = new Map();
    this.trapListener = null;
  }

  /**
   * Initialize SNMP Trap Listener on port 162
   */
  startTrapListener(port = 162) {
    if (this.trapListener) return;
    
    // In a production environment, this would need root privileges or a port > 1024
    this.trapListener = snmp.createReceiver({
      port: port,
      disableAuthorization: true
    }, (error, notification) => {
      if (error) {
         logger.error(`[SNMP TRAP ERROR] ${error.message}`);
      } else {
         this.handleSnmpTrap(notification);
      }
    });
    
    logger.info(`[SNMP] Trap listener started on port ${port}`);
  }

  handleSnmpTrap(notification) {
    // Process trap and push to RabbitMQ/BullMQ or Socket.io
    logger.info(`[SNMP TRAP] Received from ${notification.rinfo.address}`);
    // Extract OIDs and map to device_templates
  }

  /**
   * Query device via SNMP
   */
  async querySNMP(deviceIp, community, oids, version = snmp.Version2c) {
    return new Promise((resolve, reject) => {
      const session = snmp.createSession(deviceIp, community, { version });
      session.get(oids, (error, varbinds) => {
        if (error) {
          reject(error);
        } else {
          const results = varbinds.map(vb => ({
            oid: vb.oid,
            value: vb.value.toString(),
            type: vb.type
          }));
          resolve(results);
        }
        session.close();
      });
    });
  }

  /**
   * Execute command via SSH (Useful for OLTs like Huawei/ZTE)
   */
  async executeSSH(deviceIp, username, password, command) {
    return new Promise((resolve, reject) => {
      const conn = new Client();
      let output = '';
      
      conn.on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          stream.on('close', (code, signal) => {
            conn.end();
            resolve(output);
          }).on('data', (data) => {
            output += data.toString();
          }).stderr.on('data', (data) => {
            logger.warn(`[SSH STDERR] ${data}`);
          });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host: deviceIp,
        port: 22,
        username: username,
        password: password,
        readyTimeout: 10000
      });
    });
  }

  /**
   * Connect and execute via MikroTik API
   */
  async queryMikroTik(deviceIp, username, password, endpoint, params = []) {
    const conn = new RouterOSAPI({
      host: deviceIp,
      user: username,
      password: password,
      keepalive: true
    });

    try {
      await conn.connect();
      const results = await conn.write(endpoint, params);
      conn.close();
      return results;
    } catch (error) {
      conn.close();
      throw error;
    }
  }
}

module.exports = new DeviceConnectorService();
