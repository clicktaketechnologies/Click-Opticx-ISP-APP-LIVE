/**
 * seed-admin.js — creates/updates the SuperAdmin staff row in Supabase.
 *
 * SECURITY FIX: the admin password was hardcoded here. It now comes from
 * environment variables (BOOTSTRAP_ADMIN_PASSWORD_HASH = bcrypt hash).
 *
 * Usage:
 *   node backend/scripts/seed-admin.js
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *   BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD_HASH
 */
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL;
const ADMIN_HASH = process.env.BOOTSTRAP_ADMIN_PASSWORD_HASH;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_HASH) {
    console.error('Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD_HASH.');
    console.error('Generate the hash with: node -e "console.log(require(\'bcryptjs\').hashSync(\'YOUR_PASSWORD\', 10))"');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: existing } = await supabase
        .from('staff')
        .select('id, email')
        .eq('email', ADMIN_EMAIL)
        .maybeSingle();

    const row = {
        email: ADMIN_EMAIL,
        name: 'System Administrator',
        role: 'SuperAdmin',
        status: 'Active',
        password: ADMIN_HASH, // bcrypt hash — never plaintext
        balance: 0
    };

    if (existing) {
        const { error } = await supabase.from('staff').update(row).eq('id', existing.id);
        if (error) throw error;
        console.log(`✅ Updated existing admin: ${ADMIN_EMAIL}`);
    } else {
        const { error } = await supabase.from('staff').insert(row);
        if (error) throw error;
        console.log(`✅ Created admin: ${ADMIN_EMAIL}`);
    }
}

main().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
