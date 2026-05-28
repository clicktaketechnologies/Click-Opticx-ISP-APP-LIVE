
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

async function testInvoices() {
  console.log('[MODULE] Invoices');
  
  try {
    // 1. Get a user with invoices
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const testUser = listRes.data.users.find(u => u.email);
    
    console.log(`[ACTION] List invoices for ${testUser.id}`);
    const invRes = await axios.get(`${BASE_URL}/billing/invoices?userId=${testUser.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`[EXPECTED] HTTP 200, array of invoices`);
    console.log(`[ACTUAL] HTTP ${invRes.status}, count: ${invRes.data.data?.length || 0}`);
    
    if (invRes.status === 200 && invRes.data.data?.length > 0) {
      console.log('[STATUS] ✅ PASS');
      
      const testInvoice = invRes.data.data[0];
      
      // 2. Mark paid
      console.log(`[ACTION] Mark invoice ${testInvoice.id} as paid (amount: ${testInvoice.total_amount})`);
      const payRes = await axios.post(`${BASE_URL}/billing/payment`, 
        { invoiceId: testInvoice.id, amount: testInvoice.total_amount, method: 'CASH' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      console.log(`[EXPECTED] HTTP 200, invoice status PAID`);
      console.log(`[ACTUAL] HTTP ${payRes.status}, status: ${payRes.data.data?.status}`);
      
      if (payRes.status === 200 && payRes.data.data?.status === 'Paid') {
        console.log('[STATUS] ✅ PASS');
      } else {
        console.log('[STATUS] ❌ FAIL');
      }
    } else {
      console.log('[STATUS] ❌ FAIL (No invoices found for user)');
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
    if (err.response?.data) console.log('Response:', err.response.data);
  }
}

testInvoices();
