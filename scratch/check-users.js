import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
    const { data: users, error } = await supabase.from('users').select('*');
    if (error) console.error(error);
    console.log(JSON.stringify(users, null, 2));
}

checkUsers();
