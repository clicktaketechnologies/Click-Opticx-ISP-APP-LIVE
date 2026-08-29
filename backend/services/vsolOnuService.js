import { Client } from 'ssh2';

class VSOLService {
  constructor(device) {
    this.host = device.ip;
    this.username = device.username;
    this.password = device.password;
    this.port = device.port || 22;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const conn = new Client();

      conn.on('ready', () => resolve(conn))
        .on('error', reject)
        .connect({
          host: this.host,
          port: this.port,
          username: this.username,
          password: this.password,
          readyTimeout: 10000
        });
    });
  }

  async changeWifiPassword({ onuId, ssid, newPassword }) {
    const conn = await this.connect();

    return new Promise((resolve, reject) => {
      const command = `
        configure terminal
        interface gpon-onu_${onuId}
        wifi set ssid ${ssid} password ${newPassword}
        commit
      `;

      conn.exec(command, (err, stream) => {
        if (err) return reject(err);

        let output = '';

        stream.on('data', data => output += data.toString());

        stream.on('close', () => {
          conn.end();
          resolve({
            status: 'SUCCESS',
            message: 'WiFi password updated',
            raw: output
          });
        });
      });
    });
  }
}

export default VSOLService;
