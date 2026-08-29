
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

async function testSubscriberRegistry() {
  console.log('[MODULE] Subscriber Registry');
  
  try {
    console.log('[ACTION] Load all records');
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const users = listRes.data.users;
    console.log(`[EXPECTED] Real DB records, count >= 146`);
    console.log(`[ACTUAL] Count: ${users.length}`);
    
    if (users.length >= 146) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL (Count mismatch)');
    }

    // Verify KYC status presence
    console.log('[ACTION] Verify KYC status in records');
    const hasKyc = users.every(u => u.kyc_status !== undefined);
    console.log(`[EXPECTED] Every user has kyc_status`);
    console.log(`[ACTUAL] ${hasKyc ? 'All records have KYC status' : 'Missing KYC status in some records'}`);
    
    if (hasKyc) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
  }
}

testSubscriberRegistry();
