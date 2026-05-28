
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

async function testFindUsers() {
  console.log('[MODULE] Find Users');
  
  try {
    // 1. Get a user to search for
    const allUsers = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const sampleUser = allUsers.data.users.find(u => u.email);
    if (!sampleUser) {
      console.log('[STATUS] ❌ FAIL (No users found to test search)');
      return;
    }

    // 2. Search by email
    console.log(`[ACTION] Search by email: ${sampleUser.email}`);
    const searchRes = await axios.get(`${BASE_URL}/users?search=${sampleUser.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log(`[EXPECTED] HTTP 200, user ${sampleUser.email} in results`);
    const found = searchRes.data.users.find(u => u.id === sampleUser.id);
    console.log(`[ACTUAL] HTTP ${searchRes.status}, count: ${searchRes.data.users.length}, user found: ${!!found}`);
    
    if (searchRes.status === 200 && found) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
    }

    // 3. Filter by role
    console.log(`[ACTION] Filter by role: ${sampleUser.role}`);
    const filterRes = await axios.get(`${BASE_URL}/users?role=${sampleUser.role}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const allMatch = filterRes.data.users.every(u => u.role === sampleUser.role);
    console.log(`[EXPECTED] Every result has role ${sampleUser.role}`);
    console.log(`[ACTUAL] Count: ${filterRes.data.users.length}, all match: ${allMatch}`);
    
    if (filterRes.status === 200 && allMatch) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.message}`);
    console.log('[STATUS] ❌ FAIL');
  }
}

testFindUsers();
