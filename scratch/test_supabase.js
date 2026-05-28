
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);

// Debug fetch
const originalFetch = global.fetch;
global.fetch = async (...args) => {
  console.log('FETCH START:', args[0]);
  try {
    const res = await originalFetch(...args);
    console.log('FETCH SUCCESS:', res.status, res.statusText);
    return res;
  } catch (e) {
    console.error('FETCH ERROR:', e.message);
    throw e;
  }
};

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Attempting signUp...');
    const { data, error } = await supabase.auth.signUp({
      email: `test_${Date.now()}@example.com`,
      password: 'Password123!',
    });

    if (error) {
      console.error('Supabase Error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Success:', data);
    }
  } catch (e) {
    console.error('Catch Error:', e);
  }
}

test();
