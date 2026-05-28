import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runSql() {
    console.log("Calling exec_sql RPC...");
    const { data, error } = await supabase.rpc('exec_sql', {
        query: `ALTER TABLE public.audit_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();`
    });

    if (error) {
        console.error("RPC failed:", error);
    } else {
        console.log("RPC succeeded:", data);
    }
}

runSql();
