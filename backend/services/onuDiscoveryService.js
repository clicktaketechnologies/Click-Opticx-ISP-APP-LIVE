const OLTService = require('./oltService');

class ONUDiscoveryService {

  static async getUnconfiguredONUs(device) {
    try {
      const olt = new OLTService(device);
      const raw = await olt.execute('show gpon onu uncfg');
      return this.parse(raw);
    } catch (err) {
      console.error('ONU Discovery Error:', err);
      return [];
    }
  }

  static parse(data) {
    const lines = data.split('\n');

    return lines
      .filter(line => line.includes('SN'))
      .map(line => {
        const parts = line.split(/\s+/);
        return {
          serial: parts[1],
          port: parts[2],
          status: 'UNCONFIGURED'
        };
      });
  }
}

module.exports = ONUDiscoveryService;
