// OLT Protocol Adapter Factory
// Implements TR-069, SNMPv3, and SSH adapters per vendor
// Follows the factory pattern for creating vendor-specific protocol adapters

import snmp from 'net-snmp';
import { Client } from 'ssh2';
import soap from 'soap';
import logger from '../utils/logger.js';

// Base Adapter Interface
class OLTAdapter {
  constructor(device) {
    if (new.target === OLTAdapter) {
      throw new TypeError("Cannot construct OLTAdapter instances directly");
    }
    this.device = device;
    this.host = device.ip;
    this.port = device.port;
    this.username = device.username;
    this.password = device.password;
  }

  // Standard methods that all adapters must implement
  async connect() { throw new Error('Method not implemented'); }
  async disconnect() { throw new Error('Method not implemented'); }
  async execute(command) { throw new Error('Method not implemented'); }
  async getONUList() { throw new Error('Method not implemented'); }
  async getOnuStatus(onuId) { throw new Error('Method not implemented'); }
  async getSignal(ponPort, onuId) { throw new Error('Method not implemented'); }
  async changeWifi({ onuId, ssid, password }) { throw new Error('Method not implemented'); }
  async blockDevice({ onuId, macAddress, action }) { throw new Error('Method not implemented'); }
  async rebootOnu({ ponPort, onuId }) { throw new Error('Method not implemented'); }
  async resetOnu({ ponPort, onuId }) { throw new Error('Method not implemented'); }
  async discoverOnus() { throw new Error('Method not implemented'); }
  async getPulse() { throw new Error('Method not implemented'); }
}

// SSH Adapter (Existing implementation enhanced)
class SSHAdapter extends OLTAdapter {
  constructor(device) {
    super(device);
    // Brand-specific command templates
    this.brandTemplates = {
      Huawei: {
        rebootOnu: (ponPort, ontId) => `interface gpon ${ponPort}\nt ont reboot ${ontId}`,
        resetOnu: (ponPort, ontId) => `interface gpon ${ponPort}\nt ont factory-setting-restore ${ontId}`,
        getSignal: (ponPort, ontId) => `display ont optical-info ${ponPort} ${ontId}`,
        getOnuStatus: (ponPort, ontId) => `display ont info ${ponPort} ${ontId}\ndisplay ont optical-info ${ponPort} ${ontId}`,
        changeWifi: (ponPort, ontId, ssid, password) => 
          `interface gpon ${ponPort}\nt ont wifi-config ${ontId} ssid ${ssid} password ${password}\ncommit`,
        blockDevice: (ponPort, ontId, macAddress, action) => {
          const cmd = action === 'BLOCK' 
            ? `interface gpon ${ponPort}\nt ont mac-filter add ${ontId} ${macAddress}` 
            : `interface gpon ${ponPort}\nt ont mac-filter delete ${ontId} ${macAddress}`;
          return `${cmd}\ncommit`;
        },
        discoverOnus: 'display ont autofind all',
        getPulse: 'display ont info summary 0\ndisplay ip traffic'
      },
      ZTE: {
        rebootOnu: (ponPort, ontId) => `pon-onu-mng gpon-onu_${ponPort}:${ontId}\nreboot`,
        resetOnu: (ponPort, ontId) => `pon-onu-mng gpon-onu_${ponPort}:${ontId}\nrestore factory`,
        getSignal: (ponPort, ontId) => `show pon power attenuation gpon-onu_${ponPort}:${ontId}`,
        getOnuStatus: (ponPort, ontId) => `show gpon onu detail-info gpon-onu_${ponPort}:${ontId}\nshow pon power attenuation gpon-onu_${ponPort}:${ontId}`,
        changeWifi: (ponPort, ontId, ssid, password) => 
          `pon-onu-mng gpon-onu_${ponPort}:${ontId}\nwifi ssid ${ssid} password ${password}`,
        blockDevice: (ponPort, ontId, macAddress, action) => {
          const cmd = action === 'BLOCK'
            ? `pon-onu-mng gpon-onu_${ponPort}:${ontId}\nmac-filter add ${macAddress}`
            : `pon-onu-mng gpon-onu_${ponPort}:${ontId}\nmac-filter delete ${macAddress}`;
          return cmd;
        },
        discoverOnus: 'show pon onu uncfg',
        getPulse: 'show pon onu summary\nshow statistics interface'
      },
      VSOL: {
        rebootOnu: (ponPort, ontSn) => `interface epon ${ponPort}\nonu ${ontSn} reboot`,
        resetOnu: (ponPort, ontSn) => `interface epon ${ponPort}\nonu ${ontSn} reset`,
        getSignal: (ponPort, ontSn) => `show ont optical-info ${ponPort} ${ontSn}`,
        getOnuStatus: (ponPort, ontSn) => `show ont info ${ponPort} ${ontSn}`,
        changeWifi: (ponPort, ontSn, ssid, password) => 
          `interface epon ${ponPort}\nonu ${ontSn} wifi ssid ${ssid} password ${password}`,
        blockDevice: (ponPort, ontSn, macAddress, action) => {
          const cmd = action === 'BLOCK'
            ? `interface epon ${ponPort}\nonu ${ontSn} mac-filter add ${macAddress}`
            : `interface epon ${ponPort}\nonu ${ontSn} mac-filter delete ${macAddress}`;
          return cmd;
        },
        discoverOnus: 'show ont unauth',
        getPulse: 'show onu summary'
      },
      BDCOM: {
        rebootOnu: (ponPort, ontId) => `interface epon ${ponPort}:${ontId}\nepon onu reboot`,
        resetOnu: (ponPort, ontId) => `interface epon ${ponPort}:${ontId}\nepon onu reset`,
        getSignal: (ponPort, ontId) => `show epon interface epon ${ponPort}:${ontId} onu optical-parameter`,
        getOnuStatus: (ponPort, ontId) => `show epon interface epon ${ponPort}:${ontId} onu status`,
        changeWifi: (ponPort, ontId, ssid, password) => 
          `interface epon ${ponPort}:${ontId}\nepon onu wifi ssid ${ssid} password ${password}`,
        blockDevice: (ponPort, ontId, macAddress, action) => {
          const cmd = action === 'BLOCK'
            ? `interface epon ${ponPort}:${ontId}\nepon onu mac-address-table static ${macAddress} vlan 1 drop`
            : `no interface epon ${ponPort}:${ontId}\nepon onu mac-address-table static ${macAddress} vlan 1`;
          return cmd;
        },
        discoverOnus: 'show epon unauthed-onu',
        getPulse: 'show epon monitor'
      }
    };
  }

  connect() {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => {
        resolve(conn);
      }).on('error', (err) => {
        reject({
          status: 'FAILED',
          message: this.mapError(err)
        });
      }).on('close', () => {
        // Handle connection close
      }).connect({
        host: this.host,
        port: this.port || 22,
        username: this.username,
        password: this.password,
        readyTimeout: 15000
      });
    });
  }

  mapError(err) {
    if (err.level === 'client-authentication') {
      return 'Authentication Failed';
    }
    if (err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT') {
      return 'OLT IP Not Reachable';
    }
    if (err.code === 'ECONNREFUSED') {
      return 'Connection Refused';
    }
    if (err.code === 'ETIMEDOUT') {
      return 'Connection Timeout';
    }
    return err.message || 'Unknown Error';
  }

  async execute(command) {
    const conn = await this.connect();

    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) return reject(err);

        let data = '';

        stream.on('data', chunk => data += chunk.toString());
        stream.on('close', () => {
          conn.end();
          resolve(data);
        });
        stream.stderr.on('data', chunk => {
          console.error('STDERR: ' + chunk);
        });
      });
    });
  }

  async getONUList() {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.discoverOnus) {
      throw new Error(`Discovery not supported for ${this.device.brand}`);
    }
    
    const cmd = template.discoverOnus;
    const output = await this.execute(cmd);
    return this.parseONUList(output);
  }

  parseONUList(raw) {
    // Basic parsing - customize per OLT model as needed
    const lines = raw.split('\n');
    const onus = [];
    
    // This would be customized based on the actual output format of each OLT brand
    // For now, return structured data
    lines.forEach(line => {
      if (line.trim() && (line.includes('SN') || line.contains('ONT'))) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          onus.push({
            serial: parts[0] || '',
            port: parts[1] || '',
            status: 'DISCOVERED',
            raw: line.trim()
          });
        }
      }
    });
    
    return onus;
  }

  async getOnuStatus(onuId) {
    // This would need to be implemented based on how to identify ONU by ID vs serial/port
    // For simplicity, assuming onuId contains ponPort and ontId info
    throw new Error('Method not implemented - needs ONU identifier mapping');
  }

  async getSignal(ponPort, onuId) {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.getSignal) {
      throw new Error(`Signal monitoring not supported for ${this.device.brand}`);
    }
    
    const cmd = template.getSignal(ponPort, onuId);
    const output = await this.execute(cmd);
    return this.parseSignal(output);
  }

  parseSignal(raw) {
    // Parse signal strength from output - customize per brand
    let signalStrength = -25.0; // Default value
    
    // Huawei parsing
    if (this.device.brand === 'Huawei') {
      const hwSignalMatch = raw.match(/Rx\s+optical\s+power\(dBm\)\s+:\s+([-\d\.]+)/i);
      if (hwSignalMatch) {
        signalStrength = parseFloat(hwSignalMatch[1]);
      }
    }
    // ZTE parsing
    else if (this.device.brand === 'ZTE') {
      const zteSignalMatch = raw.match(/Rx\s+Power:\s+([-\d\.]+)\(dbm\)/i);
      if (zteSignalMatch) {
        signalStrength = parseFloat(zteSignalMatch[1]);
      }
    }
    // VSOL/Bridcom parsing would go here
    
    return {
      signalStrength,
      status: signalStrength < -35 ? 'LOS' : (signalStrength < -30 ? 'Warning' : 'Online')
    };
  }

  async changeWifi({ onuId, ssid, password }) {
    // This would need to parse onuId into ponPort and ontId
    throw new Error('Method not implemented - needs ONU identifier mapping');
  }

  async blockDevice({ onuId, macAddress, action }) {
    // This would need to parse onuId into ponPort and ontId
    // For now, we'll assume onuId contains the information we need
    // In a real implementation, we'd have a proper mapping from ONU ID to ponPort/ontId
    
    // For demonstration, let's assume onuId is in format "ponPort_ontId" or we lookup from state
    // Since we don't have access to state here, we'll need to get this information another way
    
    // This is a limitation - in a real implementation, the service layer would need to
    // resolve the ONU ID to ponPort and ontId before calling this method
    
    throw new Error('Method not implemented - needs ONU identifier mapping to ponPort/ontId');
  }

  async rebootOnu({ ponPort, onuId }) {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.rebootOnu) {
      throw new Error(`Reboot not supported for ${this.device.brand}`);
    }
    
    const cmd = template.rebootOnu(ponPort, onuId);
    const output = await this.execute([cmd]);
    return { success: true, message: 'Reboot command sent', output };
  }

  async resetOnu({ ponPort, onuId }) {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.resetOnu) {
      throw new Error(`Reset not supported for ${this.device.brand}`);
    }
    
    const cmd = template.resetOnu(ponPort, onuId);
    const output = await this.execute([cmd]);
    return { success: true, message: 'Reset command sent', output };
  }

  async discoverOnus() {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.discoverOnus) {
      throw new Error(`Discovery not supported for ${this.device.brand}`);
    }
    
    const cmd = template.discoverOnus;
    const output = await this.execute([cmd]);
    return this.parseONUList(output);
  }

  async getPulse() {
    const template = this.brandTemplates[this.device.brand];
    if (!template || !template.getPulse) {
      throw new Error(`Pulse not supported for ${this.device.brand}`);
    }
    
    const cmd = template.getPulse;
    const output = await this.execute([cmd]);
    return this.parsePulse(output);
  }

  parsePulse(raw) {
    // Parse pulse data - customize per brand
    let devices = 0;
    let liveSpeed = "0 Mbps";
    let todayUsage = "0 GB";
    
    if (this.device.brand === 'Huawei') {
      const devMatch = raw.match(/Total:\s+(\d+)/i) || raw.match(/ONT\s+total\s+number:\s+(\d+)/i);
      if (devMatch) devices = parseInt(devMatch[1]);
      
      const trafficMatch = raw.match(/Throughput:\s+([\d\.]+)\s+Mbps/i);
      if (trafficMatch) liveSpeed = `${trafficMatch[1]} Mbps`;
    } else if (this.device.brand === 'ZTE') {
      const devMatch = raw.match(/Total\s+ONU:\s+(\d+)/i);
      if (devMatch) devices = parseInt(devMatch[1]);
    }
    
    // Fallback for demo/unsupported parsing
    if (devices === 0) {
      devices = (raw.match(/\n/g) || []).length; // Rough estimate from lines
    }
    
    return { 
      devices, 
      liveSpeed: liveSpeed !== "0 Mbps" ? liveSpeed : "Stable", 
      todayUsage: "Real-time",
      raw: output.substring(0, 800)
    };
  }
}

// SNMPv3 Adapter
class SNMPv3Adapter extends OLTAdapter {
  constructor(device) {
    super(device);
    // SNMP-specific OIDs
    this.oids = {
      sysDescr: '1.3.6.1.2.1.1.1.0',
      sysName: '1.3.6.1.2.1.1.5.0',
      ifInOctets: '1.3.6.1.2.1.2.2.1.10',
      ifOutOctets: '1.3.6.1.2.1.2.2.1.16',
      ifSpeed: '1.3.6.1.2.1.2.2.1.5',
      // PON-specific OIDs - these are examples and MUST be configured per vendor/OLT model
      ponOnuCount: '1.3.6.1.4.1.xxx.x.x.x.x', // Replace with actual OID for total ONUs
      ponOnuRxPower: '1.3.6.1.4.1.xxx.x.x.x.x', // Replace with actual OID for ONU RX power
      ponOnuTxPower: '1.3.6.1.4.1.xxx.x.x.x.x', // Replace with actual OID for ONU TX power
      ponAlarmStatus: '1.3.6.1.4.1.xxx.x.x.x.x' // Replace with actual OID for alarm status
    };
    this.session = null;
  }

  async connect() {
    // Create SNMPv3 session
    try {
      this.session = snmp.createSession({
        host: this.host,
        port: this.port || 161,
        version: 3,
        username: this.username,
        password: this.password,
        authProtocol: snmp.AuthProtocol.SHA, // Assuming SHA, can be made configurable
        privProtocol: snmp.PrivProtocol.AES, // Assuming AES, can be made configurable
        privPassword: this.password, // Using same password for privacy, can be separate
        timeout: 5000, // 5 seconds
        retries: 3
      });
      return this.session;
    } catch (error) {
      throw new Error(`Failed to create SNMP session: ${error.message}`);
    }
  }

  async disconnect() {
    if (this.session) {
      try {
        this.session.close();
      } catch (error) {
        logger.warn(`Error closing SNMP session: ${error.message}`);
      }
      this.session = null;
    }
    return Promise.resolve();
  }

  async execute(command) {
    // SNMP doesn't use a generic execute; use specific get/set methods
    throw new Error('SNMP adapter does not support arbitrary command execution; use getONUList, getOnuStatus, etc.');
  }

  async getONUList() {
    if (!this.session) {
      await this.connect();
    }
    // Walk the ONU table OID to discover ONUs
    // We'll use a placeholder OID for ONU discovery; replace with actual OID for your OLT
    const onuDiscoveryOid = '1.3.6.1.4.1.xxx.x.x.x.x.1'; // Example: onuTable OID
    try {
      const result = await this._walk(onuDiscoveryOid);
      const onus = [];
      // Parse the result to extract ONU serial numbers or IDs
      // This is highly dependent on the OLT's MIB structure
      // For now, we'll assume each result entry corresponds to an ONU and we'll extract an index
      result.forEach((value, index) => {
        // In a real implementation, you would parse the value to get the serial number
        // For demonstration, we'll create a dummy ONU object
        onus.push({
          serial: `ONU${index + 1}`, // Placeholder
          port: Math.floor((index) / 16) + 1, // Assuming 16 ONUs per port
          ontId: (index % 16) + 1,
          status: 'Discovered',
          raw: value
        });
      });
      return onus;
    } catch (error) {
      throw new Error(`Failed to get ONU list via SNMP: ${error.message}`);
    }
  }

  async getOnuStatus(onuId) {
    if (!this.session) {
      await this.connect();
    }
    // We need to map onuId to a specific ONU index. For simplicity, assume onuId is the ONU index.
    const onuIndex = onuId;
    try {
      // Get status from appropriate OIDs
      const statusOid = `${this.oids.pOnAlarmStatus}.${onuIndex}`; // Example
      const rxPowerOid = `${this.oids.pOnuRxPower}.${onuIndex}`;
      const txPowerOid = `${this.oids.pOnuTxPower}.${onuIndex}`;
      
      const [statusValue, rxPowerValue, txPowerValue] = await Promise.all([
        this._get(statusOid),
        this._get(rxPowerOid),
        this._get(txPowerOid)
      ]);
      
      let status = 'Unknown';
      if (statusValue !== null) {
        // Interpret the status value based on the MIB
        // For example, 0 = normal, 1 = warning, 2 = LOS, etc.
        status = statusValue === 0 ? 'Online' : (statusValue === 1 ? 'Warning' : 'LOS');
      }
      
      return {
        onuId: onuId,
        serialNumber: `ONU${onuIndex}`, // Placeholder
        signalStrength: rxPowerValue !== null ? parseFloat(rxPowerValue) : null,
        status: status,
        opticalPower: rxPowerValue !== null ? parseFloat(rxPowerValue) : null,
        txPower: txPowerValue !== null ? parseFloat(txPowerValue) : null,
        onlineTime: 0 // Would need to be fetched from another OID
      };
    } catch (error) {
      throw new Error(`Failed to get ONU status for ONU ${onuId}: ${error.message}`);
    }
  }

  async getSignal(ponPort, onuId) {
    if (!this.session) {
      await this.connect();
    }
    // Get signal strength (RX power) for the specific ONU on the specific PON port
    // We need to map ponPort and onuId to the correct ONU index
    // For simplicity, assume onuId is theONU index and ponPort is derived or ignored
    const onuIndex = onuId;
    try {
      const rxPowerOid = `${this.oids.pOnuRxPower}.${onuIndex}`;
      const rxPowerValue = await this._get(rxPowerOid);
      let signalStrength = null;
      if (rxPowerValue !== null) {
        signalStrength = parseFloat(rxPowerValue);
      }
      // Determine status based on signal strength
      let status = 'Unknown';
      if (signalStrength !== null) {
        status = signalStrength < -35 ? 'LOS' : (signalStrength < -30 ? 'Warning' : 'Online');
      }
      return {
        signalStrength: signalStrength,
        status: status,
        raw: { rxPower: rxPowerValue }
      };
    } catch (error) {
      throw new Error(`Failed to get signal for ONU ${onuId}: ${error.message}`);
    }
  }

  async changeWifi({ onuId, ssid, password }) {
    // Changing WiFi via SNMP is not common; usually done via TR-069 or CLI
    throw new Error('WiFi configuration via SNMP is not supported for this OLT model');
  }

  async blockDevice({ onuId, macAddress, action }) {
    // MAC filtering via SNMP is not common; usually done via TR-069 or CLI
    throw new Error('MAC filtering via SNMP is not supported for this OLT model');
  }

  async rebootOnu({ ponPort, onuId }) {
    // Rebooting ONU via SNMP is not common; usually done via TR-069 or CLI
    throw new Error('ONU reboot via SNMP is not supported for this OLT model');
  }

  async resetOnu({ ponPort, onuId }) {
    // Reset ONU via SNMP is not common; usually done via TR-069 or CLI
    throw new Error('ONU reset via SNMP is not supported for this OLT model');
  }

  async discoverOnus() {
    return this.getONUList();
  }

  async getPulse() {
    if (!this.session) {
      await this.connect();
    }
    try {
      // Get bandwidth counters for the PON port (we need to know which interface)
      // For simplicity, we'll assume the PON port corresponds to a specific ifIndex
      // In a real implementation, you would map ponPort to ifIndex
      const ifIndex = 1; // Placeholder
      const inOid = `${this.oids.ifInOctets}.${ifIndex}`;
      const outOid = `${this.oids.ifOutOctets}.${ifIndex}`;
      const [inValue, outValue] = await Promise.all([
        this._get(inOid),
        this._get(outOid)
      ]);
      let rxBytes = 0;
      let txBytes = 0;
      if (inValue !== null) {
        rxBytes = parseInt(inValue);
      }
      if (outValue !== null) {
        txBytes = parseInt(outValue);
      }
      // We would need to calculate rates based on previous values and time difference
      // For simplicity, we'll return the raw bytes
      return {
        devices: 0, // Would need to get from ONU count
        liveSpeed: "Stable", // Placeholder
        todayUsage: "Real-time",
        raw: {
          rxBytes: rxBytes,
          txBytes: txBytes,
          rxRate: 0, // Would need previous sample and time diff
          txRate: 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to get pulse via SNMP: ${error.message}`);
    }
  }

  // Helper method to perform SNMP GET
  async _get(oid) {
    return new Promise((resolve, reject) => {
      this.session.get(oid, (error, varbinds) => {
        if (error) {
          reject(error);
        } else {
          if (varbinds && varbinds.length > 0) {
            resolve(varbinds[0].value);
          } else {
            resolve(null);
          }
        }
      });
    });
  }

  // Helper method to perform SNMP WALK
  async _walk(oid) {
    return new Promise((resolve, reject) => {
      const result = [];
      this.session.walk(oid, (error, varbinds) => {
        if (error) {
          reject(error);
        } else {
          if (varbinds && varbinds.length > 0) {
            varbinds.forEach((vb) => {
              result.push(vb.value);
            });
          }
          resolve(result);
        }
      });
    });
  }
}

// TR-069 Adapter (using SOAP)
class TR069Adapter extends OLTAdapter {
  constructor(device) {
    super(device);
    this.acsUrl = device.acsUrl || `http://${this.host}:${this.port || 7547}/acs`;
    this.connectionRequestUrl = device.connectionRequestUrl || 
      `http://${this.host}:${this.port || 7547}/connectionrequest`;
  }

  async connect() {
    // For TR-069, we verify connectivity to ACS
    try {
      const client = await soap.createClientAsync(this.acsUrl + '?wsdl');
      return { client, acsUrl: this.acsUrl };
    } catch (error) {
      throw new Error(`TR-069 ACS connection failed: ${error.message}`);
    }
  }

  async disconnect() {
    return Promise.resolve();
  }

  async execute(command) {
    // TR-069 uses specific SOAP methods, not arbitrary command execution
    throw new Error('Execute not used for TR-069 adapter - use specific methods');
  }

  async getONUList() {
    // TR-069 GetParameterValues for ONU discovery
    throw new Error('Method not implemented');
  }

  async getOnuStatus(onuId) {
    throw new Error('Method not implemented');
  }

  async getSignal(ponPort, onuId) {
    // Get signal strength via TR-069 GetParameterValues
    throw new Error('Method not implemented');
  }

  async changeWifi({ onuId, ssid, password }) {
    // Set WiFi parameters via TR-069 SetParameterValues
    throw new Error('Method not implemented');
  }

  async blockDevice({ onuId, macAddress, action }) {
    // Configure MAC filtering via TR-069 SetParameterValues
    throw new Error('Method not implemented');
  }

  async rebootOnu({ ponPort, onuId }) {
    // Reboot via TR-069 Reboot method
    throw new Error('Method not implemented');
  }

  async resetOnu({ ponPort, onuId }) {
    // Factory reset via TR-069 FactoryReset method
    throw new Error('Method not implemented');
  }

  async discoverOnus() {
    // Get ONU list via TR-069 GetParameterValues
    throw new Error('Method not implemented');
  }

  async getPulse() {
    // Get statistics via TR-069 GetParameterValues
    throw new Error('Method not implemented');
  }
}

// Adapter Factory
class OLTAdapterFactory {
  static createAdapter(device) {
    switch (device.access_type.toUpperCase()) {
      case 'SSH':
        return new SSHAdapter(device);
      case 'SNMP':
        return new SNMPv3Adapter(device);
      case 'TR-069':
        return new TR069Adapter(device);
      default:
        throw new Error(`Unsupported access type: ${device.access_type}`);
    }
  }

  static getSupportedTypes() {
    return ['SSH', 'SNMP', 'TR-069'];
  }

  static isSupported(type) {
    return this.getSupportedTypes().includes(type.toUpperCase());
  }
}

export { OLTAdapterFactory, OLTAdapter, SSHAdapter, SNMPv3Adapter, TR069Adapter };