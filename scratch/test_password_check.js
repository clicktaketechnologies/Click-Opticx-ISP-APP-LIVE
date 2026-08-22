import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testBcrypt() {
  const { data: user } = await supabase.from('users').select('*').eq('email', 'clickopticx_test_user@gmail.com').single();
  console.log('User password hash:', user.password);
  
  if (user.password) {
    const isBcryptMatch = await bcrypt.compare('TestPassword123!', user.password);
    console.log('Is Bcrypt Match for TestPassword123! :', isBcryptMatch);
  }
}

testBcrypt();
