
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function testNetworkConnectivity() {
  console.log('[MODULE] Network & Connectivity');
  
  try {
    // 1. Live OLT Pulse Check
    console.log('[ACTION] OLT Pulse Check');
    const oltConfig = {
      ip: '10.0.0.1', // Real production IP
      username: 'admin',
      password: 'password',
      brand: 'Huawei'
    };
    
    const pulseRes = await axios.post(`${BASE_URL}/network/olt/pulse`, { olt: oltConfig });
    
    console.log(`[EXPECTED] Real hardware handshake`);
    console.log(`[ACTUAL] Status: ${pulseRes.data.status}, Devices: ${pulseRes.data.devices}`);
    
    if (pulseRes.data.status === 'Online') {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log(`[STATUS] ❌ FAIL (${pulseRes.data.error || 'Offline'})`);
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
  }
}

testNetworkConnectivity();
