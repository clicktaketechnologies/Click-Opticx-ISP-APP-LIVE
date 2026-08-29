
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkPartners() {
  const { data, error } = await supabase.from('staff').select('id, name, role, dealer_code');
  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Staff/Partners:', JSON.stringify(data, null, 2));
  }
}

checkPartners();
