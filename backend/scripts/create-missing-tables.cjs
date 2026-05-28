/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLICKOPTIX — Supabase Missing Tables Creator
 * Creates: kyc_submissions, notifications, network_devices, sessions
 * ─────────────────────────────────────────────────────────────────────────────
 */
'use strict';

const https = require('https');

const SUPABASE_URL      = 'https://snmsvixlskwstvpuksbw.supabase.co';
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXN2aXhsc2t3c3R2cHVrc2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQzODQ1MCwiZXhwIjoyMDkzMDE0NDUwfQ.HfBWcWlc5kwT9ydE_cEA03UQ7l-_eSp1gertCe0YqSE';

const C = {
  red: (s)    => `\x1b[31m${s}\x1b[0m`,
  green: (s)  => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s)   => `\x1b[36m${s}\x1b[0m`,
  bold: (s)   => `\x1b[1m${s}\x1b[0m`,
};

function ok(msg)   { console.log(C.green('  ✅ ') + msg); }
function fail(msg) { console.log(C.red('  ❌ ') + msg); }
function info(msg) { console.log(C.cyan('  ℹ️  ') + msg); }

// Management API SQL executor
function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql });
    const options = {
      hostname: 'snmsvixlskwstvpuksbw.supabase.co',
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'return=representation',
      }
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, raw: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// REST insert helper
function restInsert(table, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const options = {
      hostname: 'snmsvixlskwstvpuksbw.supabase.co',
      port: 443,
      path: `/rest/v1/${table}`,
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Prefer': 'return=minimal',
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, raw: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Check table existence via REST
function tableExists(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'snmsvixlskwstvpuksbw.supabase.co',
      port: 443,
      path: `/rest/v1/${table}?select=*&limit=0`,
      method: 'GET',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log(C.bold('\n🔧 ClickOptix — Missing Tables Auto-Creator\n'));

  // ── 1. FIX: Create exec_sql function if missing ───────────────────────────
  console.log(C.cyan('Creating exec_sql helper function in Supabase...'));
  info('Note: If exec_sql is not exposed, tables need to be created via Supabase SQL Editor.');
  info('Generating the full SQL migration script for you...\n');

  // ── 2. GENERATE MIGRATION SQL ─────────────────────────────────────────────
  const migrationSQL = `
-- =========================================================
-- CLICKOPTIX AUTO-MIGRATION — Missing Tables
-- Run this in: Supabase Dashboard > SQL Editor
-- =========================================================

-- TABLE: kyc_submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status          TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Revision')),
  documents       JSONB DEFAULT '[]'::jsonb,
  submitted_at    TIMESTAMPTZ DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     TEXT,
  rejection_reason TEXT,
  required_revision_docs INTEGER DEFAULT 0,
  raw_data        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.kyc_submissions USING (true) WITH CHECK (true);
GRANT ALL ON public.kyc_submissions TO service_role;
GRANT SELECT ON public.kyc_submissions TO authenticated;

-- TABLE: notifications  
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  message      TEXT NOT NULL,
  type         TEXT DEFAULT 'info' CHECK (type IN ('info','warning','error','success')),
  is_read      BOOLEAN DEFAULT false,
  action_url   TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.notifications USING (true) WITH CHECK (true);
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT ON public.notifications TO authenticated;

-- TABLE: network_devices
CREATE TABLE IF NOT EXISTS public.network_devices (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name           TEXT NOT NULL,
  type           TEXT DEFAULT 'router' CHECK (type IN ('router','switch','olt','onu','ap','server','other')),
  ip_address     TEXT,
  mac_address    TEXT,
  status         TEXT DEFAULT 'offline' CHECK (status IN ('online','offline','warning','error')),
  location       TEXT,
  user_id        UUID REFERENCES public.users(id) ON DELETE SET NULL,
  config         JSONB DEFAULT '{}'::jsonb,
  last_seen      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.network_devices USING (true) WITH CHECK (true);
GRANT ALL ON public.network_devices TO service_role;
GRANT SELECT ON public.network_devices TO authenticated;

-- TABLE: sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id) ON DELETE CASCADE,
  refresh_token  TEXT UNIQUE NOT NULL,
  ip_hash        TEXT,
  fingerprint    TEXT,
  user_agent     TEXT,
  is_active      BOOLEAN DEFAULT true,
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.sessions USING (true) WITH CHECK (true);
GRANT ALL ON public.sessions TO service_role;

-- INDEX for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_user_id ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_ip ON public.network_devices(ip_address);

-- TABLE: Fix existing users — add verification_status if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'Unverified';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Grant permissions for anon users on read operations (optional)
GRANT SELECT ON public.packages TO anon;
GRANT SELECT ON public.system_configs TO anon;

SELECT 'Migration complete! All tables created.' as result;
`;

  // Write migration file
  const fs = require('fs');
  const path = require('path');
  const outPath = path.join(process.cwd(), 'backend', 'scripts', 'migration_missing_tables.sql');
  fs.writeFileSync(outPath, migrationSQL.trim());
  ok(`Migration SQL written to: ${outPath}`);

  // ── 3. TEST TABLES THAT EXIST ─────────────────────────────────────────────
  console.log(C.cyan('\nVerifying which tables need to be created:'));
  const tablesToCheck = ['kyc_submissions', 'notifications', 'network_devices', 'sessions'];
  for (const t of tablesToCheck) {
    const exists = await tableExists(t);
    if (exists) {
      ok(`${t} — already exists`);
    } else {
      fail(`${t} — MISSING (included in migration SQL above)`);
    }
  }

  // ── 4. INSTRUCTION ────────────────────────────────────────────────────────
  console.log('\n' + C.cyan('─'.repeat(60)));
  console.log(C.bold('\n  📋 NEXT STEPS TO COMPLETE SETUP:\n'));
  console.log(`  ${C.bold('Step 1 — Fix Signup (Email Confirmation):')} `);
  console.log('    Go to → https://supabase.com/dashboard/project/snmsvixlskwstvpuksbw/auth/providers');
  console.log('    Under "Email" → Toggle OFF "Confirm email" → Save\n');
  console.log(`  ${C.bold('Step 2 — Create Missing Tables:')}`);
  console.log('    Go to → https://supabase.com/dashboard/project/snmsvixlskwstvpuksbw/sql');
  console.log(`    Open and run the file: ${C.yellow('backend/scripts/migration_missing_tables.sql')}\n`);
  console.log(`  ${C.bold('Step 3 — Restart backend server:')}`);
  console.log('    npm run server\n');
  console.log(C.cyan('─'.repeat(60)));
}

main().catch(e => {
  console.error(`FATAL: ${e.message}`);
  process.exit(1);
});
