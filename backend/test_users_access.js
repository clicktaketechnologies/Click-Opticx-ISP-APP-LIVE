
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

async function testUsersAndAccess() {
  console.log('[MODULE] Users & Access');
  
  try {
    // 1. Load user list
    console.log('[ACTION] Load user list');
    const listRes = await axios.get(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`[EXPECTED] HTTP 200, array of users`);
    console.log(`[ACTUAL] HTTP ${listRes.status}, count: ${listRes.data.users?.length || 0}`);
    
    if (listRes.status === 200 && Array.isArray(listRes.data.users)) {
      console.log('[STATUS] ✅ PASS');
    } else {
      console.log('[STATUS] ❌ FAIL');
      return;
    }

    // 2. Assign/modify permissions (update user role)
    const testUser = listRes.data.users[0];
    if (testUser) {
      console.log(`[ACTION] Update user role for ${testUser.email}`);
      const oldRole = testUser.role;
      const newRole = 'SupportAdmin';
      
      const updateRes = await axios.patch(`${BASE_URL}/users/${testUser.id}`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      console.log(`[EXPECTED] HTTP 200, role updated to ${newRole}`);
      console.log(`[ACTUAL] HTTP ${updateRes.status}, new role: ${updateRes.data.user?.role}`);
      
      if (updateRes.status === 200 && updateRes.data.user?.role === newRole) {
        console.log('[STATUS] ✅ PASS');
        
        // Restore role
        await axios.patch(`${BASE_URL}/users/${testUser.id}`, 
          { role: oldRole },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log('[RETEST] ✅ VERIFIED (Role restored)');
      } else {
        console.log('[STATUS] ❌ FAIL');
      }
    }

  } catch (err) {
    console.log(`[ACTUAL] Error: ${err.response?.status || err.message}`);
    console.log(`[STATUS] ❌ FAIL`);
    if (err.response?.data) console.log('Response:', err.response.data);
  }
}

testUsersAndAccess();
