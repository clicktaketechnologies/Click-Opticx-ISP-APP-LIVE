
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase REST Connection...');

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  try {
    console.log('Attempting fetch system_configs...');
    const { data, error } = await supabase
      .from('system_configs')
      .select('*')
      .limit(1);

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
