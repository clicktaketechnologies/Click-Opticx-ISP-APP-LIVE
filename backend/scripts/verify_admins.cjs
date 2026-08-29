require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const emails = ['admin@clickopticx.com', 'clickopticx@gmail.com'];
    
    for (const email of emails) {
        console.log(`Verifying ${email}...`);
        
        // 1. Get user from auth
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Failed to list users:', authError.message);
            continue;
        }
        
        const authUser = authData.users.find(u => u.email === email);
        if (!authUser) {
            console.log(`User ${email} not found in Supabase Auth.`);
            continue;
        }
        
        console.log(`Found ${email} with ID ${authUser.id}. Updating email_confirm...`);
        const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(authUser.id, { email_confirm: true });
        if (updateAuthErr) console.error(`Error updating Auth for ${email}:`, updateAuthErr.message);
        
        // 2. Update public.users
        console.log(`Updating public.users for ${email}...`);
        const { error: updateDbErr } = await supabase
            .from('users')
            .update({ status: 'Active', verification_status: 'Verified' })
            .eq('id', authUser.id);
            
        if (updateDbErr) console.error(`Error updating public.users for ${email}:`, updateDbErr.message);
        else console.log(`Successfully verified ${email} in public.users.`);
    }
}
run().catch(console.error);
