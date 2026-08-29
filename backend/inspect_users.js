
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectUsers() {
  const { data, error } = await supabase.from('users').select('id, name, email, role').limit(5);
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Sample Users:', JSON.stringify(data, null, 2));
  }
}

inspectUsers();
