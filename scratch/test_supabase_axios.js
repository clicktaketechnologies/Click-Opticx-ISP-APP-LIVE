
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase with AXIOS...');

async function test() {
  try {
    console.log('Attempting POST to signup via axios...');
    const res = await axios.post(`${supabaseUrl}/auth/v1/signup`, {
      email: `axios_test_${Date.now()}@example.com`,
      password: 'Password123!',
    }, {
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      }
    });

    console.log('Success:', res.status, res.data);
  } catch (e) {
    console.error('Axios Error:', e.response?.data || e.message);
  }
}

test();
