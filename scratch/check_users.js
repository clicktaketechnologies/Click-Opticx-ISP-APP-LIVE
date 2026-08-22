import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Has Key:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users, error } = await supabase.from('users').select('id, name, email, username, phone, status, password').limit(10);
  console.log('Users error:', error);
  console.log('Users found:', users?.length);
  if (users) {
    users.forEach(u => console.log({ id: u.id, name: u.name, email: u.email, username: u.username, phone: u.phone, status: u.status, hasPass: !!u.password }));
  }

  const { data: staff, error: staffErr } = await supabase.from('staff').select('id, name, email, username, phone, role, status, password').limit(10);
  console.log('Staff error:', staffErr);
  console.log('Staff found:', staff?.length);
  if (staff) {
    staff.forEach(s => console.log({ id: s.id, name: s.name, email: s.email, role: s.role, status: s.status, hasPass: !!s.password }));
  }
}

test();
