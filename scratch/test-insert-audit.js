import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testInsert() {
    const userId = '425093ab-a7b2-4f71-ae16-16470837725b'; // new test user UUID
    const ip = '127.0.0.1';
    
    console.log("Attempting insert into audit_logs...");
    const { data, error } = await supabase.from('audit_logs').insert({
        action: 'SIGNUP_PENDING',
        user_id: userId,
        user_name: 'Test Setup User New',
        details: `User registration initialized.`,
        type: 'AUTH',
        ip_address: ip,
        metadata: { email: 'test_setup_new@clickopticx.com', phone: '1234567895', timestamp: new Date().toISOString() }
    }).select();

    if (error) {
        console.error("Insert failed:", error);
    } else {
        console.log("Insert succeeded:", data);
    }
}

testInsert();
