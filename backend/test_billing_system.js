
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

async function testBillingSystem() {
  console.log('[MODULE] Billing System');
  
  try {
    // 1. Get a user
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const testUser = listRes.data.users.find(u => u.email);
    if (!testUser) {
      console.log('[STATUS] ❌ FAIL (No users found)');
      return;
    }

    // 2. Create invoice
    console.log(`[ACTION] Create invoice for ${testUser.id}`);
    const invoiceRes = await axios.post(`${BASE_URL}/billing/invoice/bulk-generate`, 
      { userIds: [testUser.id], amount: 1500, description: 'Service Charge' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    // In previous turn, bulk-generate was implemented.
    // It returns { success: true, data: [...] }
    console.log(`[EXPECTED] HTTP 200, success true`);
    console.log(`[ACTUAL] HTTP ${invoiceRes.status}, success: ${invoiceRes.data.success}`);
    
    if (invoiceRes.status === 200 && invoiceRes.data.success) {
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

testBillingSystem();
