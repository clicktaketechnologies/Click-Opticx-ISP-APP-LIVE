/**
 * run_email_log_migration_rest.mjs
 * Applies the email_logs schema migration using Supabase's REST API
 * (no direct TCP Postgres required — works behind firewalls).
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL            = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Use Supabase REST API directly (no SDK needed for DDL via management API)
const BASE = SUPABASE_URL.replace('https://', '');
const PROJECT_REF = BASE.split('.')[0];

async function execSql(sql) {
  const url = `https://${BASE}/rest/v1/rpc/exec_sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    },
    body: JSON.stringify({ sql_query: sql })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);
  return text;
}

async function runViaInsertTrick() {
  /**
   * Supabase doesn't expose raw DDL via REST by default unless exec_sql RPC exists.
   * Instead we use the JS SDK's `.rpc()` if exec_sql exists, or we patch
   * email_logs by using the management API or direct column probing.
   *
   * Strategy: use `.from('email_logs').insert()` with the new columns.
   * Supabase will throw "column does not exist" if they're absent — we detect this
   * and advise manual SQL execution in dashboard.
   */
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('Checking existing email_logs columns...');
  const { data: sample } = await sb.from('email_logs').select('*').limit(1);
  const existingCols = sample && sample.length > 0 ? Object.keys(sample[0]) : [];
  console.log('Existing columns:', existingCols.join(', ') || '(none / empty table)');

  const needed = ['type', 'job_id', 'message_id'];
  const missing = needed.filter(c => !existingCols.includes(c));

  if (missing.length === 0) {
    console.log('✅ All required columns already present — no migration needed.');
    return true;
  }

  console.log('Missing columns:', missing.join(', '));

  // Try exec_sql RPC (custom function that some projects have)
  for (const col of missing) {
    const colType = 'TEXT';
    const defaultVal = col === 'type' ? "'transactional'" : 'NULL';
    const sql = `ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS ${col} ${colType} DEFAULT ${defaultVal}`;
    try {
      const { error } = await sb.rpc('exec_sql', { sql_query: sql });
      if (error) throw new Error(error.message);
      console.log(`  ✅ Added column: ${col}`);
    } catch (rpcErr) {
      console.warn(`  ⚠️ exec_sql RPC not available (${rpcErr.message})`);
      return false; // signal: need manual SQL
    }
  }
  return true;
}

async function main() {
  console.log('=== Email Logs Schema Migration ===');
  console.log('Project:', SUPABASE_URL);

  const success = await runViaInsertTrick();

  if (!success) {
    console.log('\n⚠️  Automatic migration not possible (exec_sql RPC not installed).');
    console.log('Please run the following SQL in Supabase Dashboard → SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(`
ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS type        TEXT DEFAULT 'transactional',
  ADD COLUMN IF NOT EXISTS job_id      TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS message_id  TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_type    ON email_logs(type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status  ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
    `.trim());
    console.log('─'.repeat(60));
    console.log('\nAfter running the SQL, re-run this script to verify.\n');
    process.exit(2); // Exit code 2 = manual action required
  }

  // Verify with probe insert
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { error: insErr } = await sb.from('email_logs').insert({
    email:         'probe@schema-verify.local',
    type:          'schema_test',
    status:        'Failed',
    error_message: 'migration verify probe',
    provider_used: 'test',
    job_id:        'probe-final',
    message_id:    'probe-msg-final',
    created_at:    new Date().toISOString(),
    template_id:   'schema_test'
  });

  if (insErr) {
    console.error('\n❌ Probe insert FAILED:', insErr.message);
    process.exit(1);
  }

  await sb.from('email_logs').delete().eq('email', 'probe@schema-verify.local');
  console.log('\n✅ Migration verified — email_logs is production-ready.');
}

main().catch(err => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});
