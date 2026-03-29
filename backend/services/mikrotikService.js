const MikroNode = require('mikronode');

class MikroTikService {
  constructor(device) {
    this.host = device.ip;
    this.user = device.username;
    this.password = device.password;
  }

  async connect() {
    this.connection = await MikroNode.connect(
      this.host,
      this.user,
      this.password
    );
    this.channel = this.connection.openChannel();
  }

  async getActiveUsers() {
    await this.connect();

    const result = await this.channel.write('/ppp/active/print');
    
    // Always clean up the connection after fetching
    await this.disconnect();

    return result.map(user => ({
      name: user.name,
      address: user.address,
      uptime: user.uptime
    }));
  }

  async getUserTraffic(username) {
    await this.connect();

    const result = await this.channel.write([
      '/interface/monitor-traffic',
      `=interface=${username}`,
      '=once='
    ]);

    await this.disconnect();
    return result;
  }

  async disconnect() {
    if (this.connection) {
      this.connection.close();
    }
  }
}

module.exports = MikroTikService;
