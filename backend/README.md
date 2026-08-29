# Click Opticx Backend Middleware

Backend service for ISP infrastructure management, enabling live communication with MikroTik routers and VSOL OLTs.

## Features

- 🔌 **Device Connection Testing** - Verify connectivity to MikroTik and OLT devices
- 📡 **Real-time Telemetry** - WebSocket-based bandwidth monitoring via SNMP
- 🔧 **MikroTik Integration** - RouterOS API for subscriber management
- 🌐 **OLT Provisioning** - SSH automation for ONU binding
- 🔒 **Security** - Rate limiting, CORS, Helmet protection

## Prerequisites

- Node.js >= 16.0.0
- Network access to ISP devices (192.168.x.x)
- Device credentials (username/password)

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Copy the environment template:
```bash
cp .env.example .env
```

2. Edit `.env` with your settings:
```env
PORT=5000
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
ALLOWED_ORIGINS=http://localhost:5173,https://your-domain.com
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT).

## API Endpoints

### Health Check
```
GET /api/health
```

### Device Management
```
POST /api/devices/register
POST /api/devices/:deviceId/test
POST /api/devices/:deviceId/reset-wifi
POST /api/devices/:deviceId/provision-onu
GET /api/devices
```

### WebSocket Events
```
subscribe-bandwidth - Start real-time bandwidth monitoring
bandwidth-update - Receive bandwidth data every 2 seconds
```

## Device Types Supported

### MikroTik (RouterOS)
- Protocol: RouterOS API (Port 8728)
- Features: WiFi management, subscriber queues, PPPoE secrets

### VSOL OLT (EPON/GPON)
- Protocol: SSH (Port 22)
- Features: ONU provisioning, VLAN configuration

## Security Considerations

⚠️ **IMPORTANT**: This backend MUST run on your internal ISP network, NOT exposed to the public internet.

- Deploy on internal server (e.g., 192.168.1.100)
- Configure firewall to only accept connections from frontend domain
- Use strong JWT secrets
- Enable HTTPS in production
- Whitelist backend IP on all devices

## Logging

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only

## Troubleshooting

### Connection Timeouts
- Verify device IP is reachable: `ping 192.168.x.x`
- Check firewall rules on devices
- Verify credentials are correct

### SNMP Errors
- Ensure SNMP is enabled on devices
- Verify community string (default: 'public')
- Check SNMP version (v2c recommended)

### SSH Failures
- Verify SSH is enabled on OLT
- Check port 22 is accessible
- Use key-based auth for better security

## Production Deployment

1. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start server.js --name isp-backend
pm2 save
pm2 startup
```

2. Enable HTTPS with reverse proxy (nginx/Apache)

3. Set up monitoring (Prometheus + Grafana)

## License

Proprietary - Click Opticx ISP Management System
