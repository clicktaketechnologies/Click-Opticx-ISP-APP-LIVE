import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserLookup(identifier) {
  let { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();

  if (!user || error) {
    const { data: staffUser, error: staffErr } = await supabase
      .from('staff')
      .select('*')
      .eq('email', identifier)
      .maybeSingle();
    user = staffUser;
    if (staffErr) console.log('Staff lookup error:', staffErr);
  }

  return user;
}

async function run() {
  console.log('--- Testing User Lookups ---');
  
  const adminUser = await testUserLookup('admin@clickopticx.com');
  console.log('admin@clickopticx.com lookup:', adminUser ? 'Found: ' + adminUser.name : 'Not in DB (Handled by hardcoded fallback)');

  const testUser = await testUserLookup('test_setup_user@clickopticx.com');
  console.log('test_setup_user@clickopticx.com lookup:', testUser ? 'Found: ' + testUser.name + ' (Status: ' + testUser.status + ')' : 'Not found');

  const phoneUser = await testUserLookup('1234567890');
  console.log('Phone 1234567890 lookup:', phoneUser ? 'Found: ' + phoneUser.name : 'Not found');

  const testUser1 = await testUserLookup('clickopticx_test_user@gmail.com');
  console.log('clickopticx_test_user@gmail.com lookup:', testUser1 ? 'Found: ' + testUser1.name : 'Not found');
}

run();
