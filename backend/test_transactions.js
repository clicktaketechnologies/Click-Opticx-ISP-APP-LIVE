
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

async function testTransactionHistory() {
  console.log('[MODULE] Transaction History');
  
  try {
    console.log('[ACTION] Scroll ledger / List transactions');
    const res = await axios.get(`${BASE_URL}/finance/transactions`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`[EXPECTED] HTTP 200, array of transactions`);
    console.log(`[ACTUAL] HTTP ${res.status}, count: ${res.data.transactions?.length || 0}`);
    
    if (res.status === 200 && res.data.success) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
  }
}

testTransactionHistory();
