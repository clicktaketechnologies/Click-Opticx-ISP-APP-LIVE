import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n══════════════════════════════════════════');
console.log('  email_providers table check            ');
console.log('══════════════════════════════════════════\n');

// 1. Check email_providers table
const { data: providers, error: provErr } = await supabase
  .from('email_providers')
  .select('*');

if (provErr) {
  console.error('❌ Could not read email_providers table:', provErr.message);
  console.log('   → Table may not exist! Run the INSERT below to create entries.');
} else if (!providers || providers.length === 0) {
  console.warn('⚠️  email_providers table exists but is EMPTY!');
  console.log('   → The email router has no providers configured.\n');
} else {
  console.log('Current email_providers rows:\n');
  providers.forEach(p => {
    const status = p.enabled ? '✅ ENABLED' : '❌ DISABLED';
    console.log(`  id="${p.id}" | enabled=${p.enabled} | status=${p.status} → ${status}`);
  });
}

// 2. Check recent email_logs
console.log('\n── Recent email_logs (last 5) ──────────────────────');
const { data: logs, error: logErr } = await supabase
  .from('email_logs')
  .select('id, to_email, type, status, error, created_at, provider')
  .order('created_at', { ascending: false })
  .limit(5);

if (logErr) {
  console.error('❌ Could not read email_logs:', logErr.message);
} else if (!logs || logs.length === 0) {
  console.warn('⚠️  No email logs found — emails may not be reaching the router at all.');
} else {
  logs.forEach(l => {
    const icon = l.status === 'success' ? '✅' : '❌';
    console.log(`  ${icon} [${l.created_at?.slice(0,19)}] to=${l.to_email} type=${l.type} status=${l.status} provider=${l.provider} err=${l.error || 'none'}`);
  });
}

// 3. FIX: Upsert correct provider rows if table is empty or missing entries
console.log('\n── Upserting correct provider rows ─────────────────');
const { error: upsertErr } = await supabase
  .from('email_providers')
  .upsert([
    {
      id: 'resend',
      name: 'Resend',
      enabled: true,
      status: 'Healthy',
      priority: 1,
      config: {
        api_key: process.env.RESEND_API_KEY,
        from_address: process.env.EMAIL_FROM_ADDRESS || 'no-reply@clickopticx.com',
        from_name: process.env.EMAIL_FROM_NAME || 'Click Opticx'
      }
    },
    {
      id: 'gmail_smtp',
      name: 'Gmail SMTP',
      enabled: true,
      status: 'Healthy',
      priority: 2,
      config: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    }
  ], { onConflict: 'id' });

if (upsertErr) {
  console.error('❌ Upsert failed:', upsertErr.message);
  console.log('   (Table may not exist or column mismatch — see note below)');
} else {
  console.log('✅ Providers upserted successfully (resend + gmail_smtp both ENABLED)');
}

console.log('\n══ Done ══\n');
