import { Client } from 'ssh2';

class OLTService {
  constructor(device) {
    this.host = device.ip;
    this.username = device.username;
    this.password = device.password;
    this.port = device.port || 22;
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
      }).connect({
        host: this.host,
        port: this.port,
        username: this.username,
        password: this.password,
        readyTimeout: 10000
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

  // 📡 Fetch ONU list
  async getONUList() {
    const cmd = 'show gpon onu state all';
    const output = await this.execute(cmd);

    return this.parseONU(output);
  }

  parseONU(raw) {
    // Basic parsing (customize per OLT model)
    const lines = raw.split('\n');
    return lines.map(line => ({
      raw: line.trim()
    })).filter(o => o.raw.length > 0);
  }
}

export default OLTService;
