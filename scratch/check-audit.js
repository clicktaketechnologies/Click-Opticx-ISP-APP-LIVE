import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkAuditLogs() {
    const { data: logs, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(5);
    if (error) console.error(error);
    console.log(JSON.stringify(logs, null, 2));
}

checkAuditLogs();
