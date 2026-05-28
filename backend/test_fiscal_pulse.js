
import jwt from 'jsonwebtoken';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = 'http://localhost:5000/api';
const SECRET = process.env.JWT_SECRET || 'secret';

const adminToken = jwt.sign(
  { id: 'admin-001', role: 'SuperAdmin', name: 'Antigravity Validator' },
  SECRET,
  { expiresIn: '1h' }
);

async function testFiscalPulse() {
  console.log('[MODULE] Fiscal Pulse');
  
  try {
    console.log('[ACTION] View revenue/margin/tax metrics');
    const pulseRes = await axios.get(`${BASE_URL}/finance/pulse`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`[EXPECTED] HTTP 200, real aggregate pulse`);
    console.log(`[ACTUAL] HTTP ${pulseRes.status}, data:`, JSON.stringify(pulseRes.data.pulse, null, 2));
    
    if (pulseRes.status === 200 && pulseRes.data.success) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
    if (err.response?.data) console.log('Response:', err.response.data);
  }
}

testFiscalPulse();
