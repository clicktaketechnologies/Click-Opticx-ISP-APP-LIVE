/**
 * test-live-signup.mjs
 * Tests the actual live backend signup → OTP email flow end-to-end.
 * Run: node backend/scripts/test-live-signup.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n══════════════════════════════════════════');
console.log('  Live Signup + OTP Email Flow Test     ');
console.log('══════════════════════════════════════════');
console.log(`  Backend URL: ${BACKEND_URL}\n`);

// ── 1. Call the signup endpoint ─────────────────────────────────────────────
const testEmail = `test-otp-${Date.now()}@gmail.com`;
console.log(`── Step 1: Calling POST /api/auth/signup with ${testEmail}...`);

let signupResult = null;
try {
  const resp = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'OTP Test User',
      username: `otptest${Date.now()}`,
      email: testEmail,
      phone: `030${Math.floor(10000000 + Math.random() * 89999999)}`,
      password: 'Test@1234',
    }),
  });
  signupResult = await resp.json();
  console.log(`  HTTP Status : ${resp.status}`);
  console.log(`  Response    :`, JSON.stringify(signupResult, null, 2));
} catch (err) {
  console.error('❌ Cannot reach backend:', err.message);
  console.log('   Make sure the backend is running locally (npm run dev) or update BACKEND_URL env var.');
  process.exit(1);
}

// ── 2. Check email_logs for delivery result ─────────────────────────────────
console.log('\n── Step 2: Checking email_logs in Supabase...');
await new Promise(r => setTimeout(r, 3000)); // wait 3s for async log write

const { data: logs, error: logErr } = await supabase
  .from('email_logs')
  .select('*')
  .eq('email', testEmail)
  .order('created_at', { ascending: false })
  .limit(3);

if (logErr) {
  console.error('❌ email_logs query failed:', logErr.message);
  console.log('   Columns used by email-log.js: email, status, provider_used, error_message, subject, template_id, created_at');
} else if (!logs || logs.length === 0) {
  console.warn('⚠️  No email_log rows found for this email.');
  console.log('   This means the email delivery was NOT attempted or logging itself failed.');
  console.log('   Check backend console for [RESEND-DIRECT] or [GMAIL-FALLBACK] lines.');
} else {
  console.log('Email log entries found:');
  logs.forEach(l => {
    const ok = l.status === 'Delivered' ? '✅' : '❌';
    console.log(`  ${ok} status="${l.status}" provider="${l.provider_used}" error="${l.error_message || 'none'}" at=${l.created_at}`);
  });
}

// ── 3. Cleanup — delete the test auth user ───────────────────────────────────
if (signupResult?.userId) {
  console.log('\n── Step 3: Cleaning up test user...');
  const { error: delErr } = await supabase.auth.admin.deleteUser(signupResult.userId);
  if (delErr) {
    console.warn('  ⚠️  Could not delete test auth user:', delErr.message);
  } else {
    await supabase.from('users').delete().eq('id', signupResult.userId);
    console.log('  ✅ Test user cleaned up.');
  }
}

console.log('\n══ Test complete ══\n');
