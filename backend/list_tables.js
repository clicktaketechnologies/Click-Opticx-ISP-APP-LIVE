
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables');
  if (error) {
    console.error('Error fetching tables:', error.message);
    // Fallback: try to query a common table to see if it works
    const { data: d2, error: e2 } = await supabase.from('users').select('id').limit(1);
    if (e2) console.error('Users table error:', e2.message);
    else console.log('Users table exists');
  } else {
    console.log('Tables:', data);
  }
}

listTables();
