require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const adminUser = {
        id: 'ADM-001',
        name: 'System Administrator',
        email: 'admin@clickopticx.com',
        username: 'admin',
        password: await bcrypt.hash('Click@Opticx2026', 10),
        role: 'Admin',
        status: 'Active',
        is_kyc_verified: true,
        created_at: new Date().toISOString()
    };

    console.log(`🚀 Seeding admin user: ${adminUser.email}`);

    const { data, error } = await supabase
        .from('users')
        .upsert(adminUser, { onConflict: 'id' });

    if (error) {
        console.error('❌ Error seeding admin:', error.message);
        process.exit(1);
    }

    console.log('✅ Admin user seeded successfully');
    process.exit(0);
}

seedAdmin();
