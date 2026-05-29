import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProviders() {
  const { data, error } = await supabase.from('email_providers').select('*');
  if (error) {
    console.error('Error fetching email providers:', error.message);
  } else {
    console.log('Email Providers:', JSON.stringify(data, null, 2));
  }
}

checkProviders();
