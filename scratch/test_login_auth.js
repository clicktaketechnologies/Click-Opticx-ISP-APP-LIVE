import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testStaffQuery() {
  const identifier = 'admin@clickopticx.com';
  console.log('Testing staff query with email:', identifier);
  const { data: staffUser, error } = await supabase
    .from('staff')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();
  console.log('Staff result:', staffUser);
  console.log('Staff error:', error);
}

async function testUserQuery() {
  const identifier = 'test_setup_user@clickopticx.com';
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .or(`email.eq.${identifier},username.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();
  console.log('User result:', user);
  console.log('User error:', error);
}

async function run() {
  await testStaffQuery();
  await testUserQuery();
}
run();
