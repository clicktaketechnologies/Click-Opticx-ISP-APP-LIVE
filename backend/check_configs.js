
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConfigs() {
  const { data, error } = await supabase.from('system_configs').select('*');
  if (error) {
    console.error('Error fetching configs:', error.message);
  } else {
    console.log('System Configs:', JSON.stringify(data, null, 2));
  }
}

checkConfigs();
