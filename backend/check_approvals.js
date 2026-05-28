
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSignupRequests() {
  const { count, error } = await supabase.from('signup_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Pending Signup Requests count:', count);
  }
}

checkSignupRequests();
