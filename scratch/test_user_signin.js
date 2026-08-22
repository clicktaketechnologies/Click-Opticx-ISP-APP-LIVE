import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignIn() {
  const email = 'clickopticx_test_user@gmail.com';
  console.log('Testing Supabase Auth signIn for:', email);
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: 'TestPassword123!'
    });
    console.log('Supabase Auth response:', { data, error });
  } catch (err) {
    console.error('Supabase Auth error:', err);
  }
}

testSignIn();
