
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
  const { count, error } = await supabase.from('financial_transactions').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error fetching count:', error.message);
  } else {
    console.log('financial_transactions count:', count);
  }
}

checkTable();
