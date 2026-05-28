
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOtherRoles() {
  const { data, error } = await supabase.from('users').select('role').neq('role', 'Customer');
  if (error) {
    console.error('Error:', error.message);
  } else {
    const counts = data.reduce((acc, curr) => {
      acc[curr.role] = (acc[curr.role] || 0) + 1;
      return acc;
    }, {});
    console.log('Other User Roles:', counts);
  }
}

checkOtherRoles();
