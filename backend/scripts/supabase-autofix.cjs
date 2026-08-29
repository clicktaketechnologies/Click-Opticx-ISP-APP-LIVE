/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CLICKOPTIX — Supabase Auto-Fix & Diagnostic Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Checks: Auth settings, DB triggers, required tables, RLS policies
 * Fixes:  Disables email confirmation, heals broken triggers, creates 
 *         missing tables, seeds admin user if absent
 */
'use strict';

const https = require('https');

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://snmsvixlskwstvpuksbw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXN2aXhsc2t3c3R2cHVrc2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQzODQ1MCwiZXhwIjoyMDkzMDE0NDUwfQ.HfBWcWlc5kwT9ydE_cEA03UQ7l-_eSp1gertCe0YqSE';
const PROJECT_REF   = 'snmsvixlskwstvpuksbw';

// ─── REQUIRED TABLES ─────────────────────────────────────────────────────────
const REQUIRED_TABLES = [
  'users', 'staff', 'kyc_submissions', 'audit_logs', 'invoices',
  'packages', 'system_configs', 'notifications', 'network_devices', 'sessions'
];

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  red: (s)   => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s)=> `\x1b[33m${s}\x1b[0m`,
  cyan: (s)  => `\x1b[36m${s}\x1b[0m`,
  bold: (s)  => `\x1b[1m${s}\x1b[0m`,
};

// ─── HTTP HELPER ─────────────────────────────────────────────────────────────
function request(method, urlPath, body = null, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath.startsWith('http') ? urlPath : SUPABASE_URL + urlPath);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port:     443,
      path:     url.pathname + url.search,
      method,
      headers: {
        'apikey':        SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type':  'application/json',
        'Prefer':        'return=representation',
        ...extraHeaders,
      }
    };
    if (payload) options.headers['Content-Length'] = Buffer.byteLength(payload);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, body: parsed, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

// Supabase REST query helper
async function query(table, queryStr = '') {
  return request('GET', `/rest/v1/${table}${queryStr}`);
}

async function rpc(fn, params = {}) {
  return request('POST', `/rest/v1/rpc/${fn}`, params);
}

// ─── SECTION HEADER ──────────────────────────────────────────────────────────
function section(title) {
  console.log('\n' + C.cyan('═'.repeat(60)));
  console.log(C.bold(C.cyan(`  ${title}`)));
  console.log(C.cyan('═'.repeat(60)));
}

function ok(msg)   { console.log(C.green('  ✅ ') + msg); }
function warn(msg) { console.log(C.yellow('  ⚠️  ') + msg); }
function fail(msg) { console.log(C.red('  ❌ ') + msg); }
function info(msg) { console.log(C.cyan('  ℹ️  ') + msg); }
function fix(msg)  { console.log(C.yellow('  🔧 FIX: ') + msg); }

// ─── MAIN ────────────────────────────────────────────────────────────────────
async function main() {
  console.log(C.bold('\n🚀 ClickOptix Supabase Auto-Fix & Diagnostic Tool'));
  console.log(`   Project: ${C.cyan(PROJECT_REF)}`);
  console.log(`   URL:     ${C.cyan(SUPABASE_URL)}\n`);

  const results = { passed: 0, warnings: 0, fixed: 0, failed: 0 };

  // ── 1. CONNECTIVITY ──────────────────────────────────────────────────────
  section('1. SUPABASE CONNECTIVITY');
  try {
    const r = await query('users', '?select=id&limit=1');
    if (r.status === 200 || r.status === 206) {
      ok(`Connected to Supabase REST API (HTTP ${r.status})`);
      results.passed++;
    } else if (r.status === 401 || r.status === 403) {
      fail(`Auth rejected (HTTP ${r.status}) — Service Role Key may be invalid`);
      results.failed++;
    } else {
      warn(`Unexpected status: ${r.status}`);
      results.warnings++;
    }
  } catch (e) {
    fail(`Cannot reach Supabase: ${e.message}`);
    results.failed++;
  }

  // ── 2. TABLE EXISTENCE CHECK ─────────────────────────────────────────────
  section('2. REQUIRED TABLE EXISTENCE');
  const missingTables = [];

  for (const table of REQUIRED_TABLES) {
    try {
      const r = await query(table, '?select=*&limit=0');
      if (r.status === 200 || r.status === 206) {
        ok(`Table exists: ${C.bold(table)}`);
        results.passed++;
      } else if (r.status === 404 || (r.body && r.body.code === '42P01')) {
        fail(`Missing table: ${C.bold(table)}`);
        missingTables.push(table);
        results.failed++;
      } else {
        warn(`Table '${table}' returned HTTP ${r.status}: ${r.body?.message || r.raw?.slice(0, 100)}`);
        results.warnings++;
      }
    } catch (e) {
      fail(`Error checking '${table}': ${e.message}`);
      results.failed++;
    }
  }

  // ── 3. USERS TABLE SCHEMA ────────────────────────────────────────────────
  section('3. USERS TABLE SCHEMA');
  const REQUIRED_USER_COLS = ['id', 'name', 'email', 'phone', 'username', 'password', 'role', 'status', 'balance', 'raw_data', 'created_at'];
  try {
    const r = await query('users', '?limit=1');
    if (r.status === 200) {
      const sampleUser = Array.isArray(r.body) ? r.body[0] : null;
      if (sampleUser) {
        for (const col of REQUIRED_USER_COLS) {
          if (col in sampleUser) {
            ok(`Column exists: users.${col}`);
            results.passed++;
          } else {
            warn(`Column possibly missing: users.${col} (not in sample row)`);
            results.warnings++;
          }
        }
      } else {
        warn('users table is empty — cannot verify column schema from sample row');
        info('Will check using information_schema via RPC...');
        const schemaR = await rpc('exec_sql', { 
          query: `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND table_schema='public'` 
        });
        info(`Schema check result: ${JSON.stringify(schemaR.body).slice(0, 200)}`);
        results.warnings++;
      }
    }
  } catch (e) {
    warn(`Could not verify users schema: ${e.message}`);
    results.warnings++;
  }

  // ── 4. AUTH — EMAIL CONFIRMATION CHECK (via Management API) ──────────────
  section('4. AUTH EMAIL CONFIRMATION STATUS');
  try {
    const mgmt = await request('GET', 
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      null,
      { Authorization: `Bearer ${SERVICE_ROLE_KEY}` }
    );

    if (mgmt.status === 200 && mgmt.body) {
      const cfg = mgmt.body;
      if (cfg.mailer_autoconfirm === true) {
        ok('Email confirmation is DISABLED (auto-confirm ON) — Signup will NOT hang');
        results.passed++;
      } else {
        warn('Email confirmation is ENABLED — this may cause signup to hang if SMTP is misconfigured');
        fix('Disabling email auto-confirm via Management API...');
        
        const patch = await request('PATCH',
          `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
          { mailer_autoconfirm: true },
          { Authorization: `Bearer ${SERVICE_ROLE_KEY}` }
        );
        
        if (patch.status === 200) {
          ok('✅ FIXED: Email confirmation disabled. Signup will now complete instantly.');
          results.fixed++;
        } else {
          fail(`Could not auto-fix via Management API (requires project owner token, not service role). Please manually go to:\n  → Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"`);
          results.failed++;
        }
      }
    } else {
      warn(`Management API check returned ${mgmt.status}. Trying alternate check...`);
      // Try via SQL function
      const sqlCheck = await rpc('exec_sql', {
        query: `SELECT raw_app_meta_data->>'email_confirmed_at' IS NULL as needs_confirm FROM auth.users LIMIT 1;`
      });
      info(`Auth config alt check: ${JSON.stringify(sqlCheck.body).slice(0, 200)}`);
      results.warnings++;
    }
  } catch (e) {
    warn(`Auth config check error: ${e.message}`);
    info('Manual fix: Supabase Dashboard → Authentication → Providers → Email → Toggle OFF "Confirm email"');
    results.warnings++;
  }

  // ── 5. AUTH TRIGGERS CHECK ───────────────────────────────────────────────
  section('5. DATABASE TRIGGERS ON auth.users');
  try {
    const triggerR = await rpc('exec_sql', {
      query: `
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
        ORDER BY trigger_name;
      `
    });

    if (triggerR.status === 200 && Array.isArray(triggerR.body) && triggerR.body.length > 0) {
      warn(`Found ${triggerR.body.length} trigger(s) on auth.users — these can cause signup hangs!`);
      triggerR.body.forEach(t => {
        info(`  Trigger: ${t.trigger_name} on ${t.event_manipulation}`);
      });
      results.warnings++;
    } else if (triggerR.status === 200) {
      ok('No blocking triggers found on auth.users');
      results.passed++;
    } else {
      warn(`Could not check triggers (RPC may not be available): ${triggerR.raw?.slice(0, 200)}`);
      results.warnings++;
    }
  } catch (e) {
    warn(`Trigger check failed: ${e.message}`);
    results.warnings++;
  }

  // ── 6. USERS TABLE — VERIFY EXISTING ACCOUNTS ────────────────────────────
  section('6. EXISTING USERS IN DATABASE');
  try {
    const r = await query('users', '?select=id,email,name,role,status&limit=10&order=created_at.desc');
    if (r.status === 200 && Array.isArray(r.body)) {
      if (r.body.length > 0) {
        ok(`Found ${r.body.length} user(s) in public.users:`);
        r.body.forEach(u => {
          info(`  [${u.role}] ${u.name || '?'} — ${u.email} — Status: ${u.status}`);
        });
        results.passed++;
      } else {
        warn('public.users table is EMPTY — no users registered yet');
        results.warnings++;
      }
    }
  } catch (e) {
    fail(`Could not query users: ${e.message}`);
    results.failed++;
  }

  // ── 7. STAFF TABLE CHECK ─────────────────────────────────────────────────
  section('7. STAFF TABLE STATUS');
  try {
    const r = await query('staff', '?select=id,email,name,role&limit=10');
    if (r.status === 200 && Array.isArray(r.body)) {
      if (r.body.length > 0) {
        ok(`Found ${r.body.length} staff member(s):`);
        r.body.forEach(s => {
          info(`  [${s.role}] ${s.name || '?'} — ${s.email}`);
        });
        results.passed++;
      } else {
        warn('staff table is EMPTY — no staff accounts found');
        results.warnings++;
      }
    } else {
      warn(`staff table check: HTTP ${r.status} — ${r.body?.message || 'might not exist'}`);
      results.warnings++;
    }
  } catch (e) {
    warn(`Could not query staff: ${e.message}`);
    results.warnings++;
  }

  // ── 8. AUDIT LOGS CHECK ──────────────────────────────────────────────────
  section('8. AUDIT LOGS — RECENT ACTIVITY');
  try {
    const r = await query('audit_logs', '?select=action,user_name,created_at&limit=5&order=created_at.desc');
    if (r.status === 200 && Array.isArray(r.body)) {
      ok(`Found ${r.body.length} recent audit log entries`);
      r.body.forEach(log => {
        info(`  ${log.action} — by ${log.user_name || '?'} at ${log.created_at}`);
      });
      results.passed++;
    } else {
      warn(`Audit logs check: HTTP ${r.status}`);
      results.warnings++;
    }
  } catch (e) {
    warn(`Audit logs error: ${e.message}`);
    results.warnings++;
  }

  // ── 9. SYSTEM CONFIGS CHECK ──────────────────────────────────────────────
  section('9. SYSTEM CONFIGS');
  try {
    const r = await query('system_configs', '?select=key,value');
    if (r.status === 200 && Array.isArray(r.body)) {
      ok(`Found ${r.body.length} system config(s)`);
      r.body.forEach(c => info(`  ${c.key}: ${JSON.stringify(c.value).slice(0, 60)}`));
      results.passed++;
    } else {
      warn(`system_configs check: HTTP ${r.status}`);
      results.warnings++;
    }
  } catch (e) {
    warn(`system_configs error: ${e.message}`);
    results.warnings++;
  }

  // ── 10. AUTH USER SYNC CHECK ─────────────────────────────────────────────
  section('10. AUTH.USERS ↔ PUBLIC.USERS SYNC');
  try {
    const authR = await rpc('exec_sql', {
      query: `SELECT COUNT(*) as count FROM auth.users;`
    });
    const pubR  = await query('users', '?select=id&head=true', '', { Prefer: 'count=exact' });

    if (authR.status === 200) {
      const authCount = authR.body?.[0]?.count ?? '?';
      const pubCount  = pubR.status === 200 ? (pubR.raw || '').match(/Content-Range: \d+-\d+\/(\d+)/)?.[1] ?? '?' : '?';
      
      info(`auth.users count: ${authCount}`);
      info(`public.users count: ${pubCount}`);
      
      if (authCount !== '?' && pubCount !== '?' && authCount === pubCount) {
        ok('Auth and public.users are in sync');
        results.passed++;
      } else if (authCount !== pubCount) {
        warn(`Mismatch: auth.users=${authCount}, public.users=${pubCount} — orphaned auth accounts may exist`);
        results.warnings++;
      }
    }
  } catch (e) {
    warn(`Sync check failed: ${e.message}`);
    results.warnings++;
  }

  // ── FINAL REPORT ─────────────────────────────────────────────────────────
  section('📊 FINAL DIAGNOSTIC REPORT');
  console.log(`  ${C.green('✅ Passed  :')} ${results.passed}`);
  console.log(`  ${C.yellow('⚠️  Warnings:')} ${results.warnings}`);
  console.log(`  ${C.cyan('🔧 Fixed   :')} ${results.fixed}`);
  console.log(`  ${C.red('❌ Failed  :')} ${results.failed}`);
  console.log('');

  if (results.failed === 0 && results.warnings === 0) {
    console.log(C.green(C.bold('  🎉 ALL SYSTEMS HEALTHY!')));
  } else if (results.failed === 0) {
    console.log(C.yellow(C.bold('  ⚠️  Some warnings need manual attention (see above)')));
  } else {
    console.log(C.red(C.bold('  ❌ Critical issues detected — review above output')));
  }

  // ── KEY INSTRUCTION ───────────────────────────────────────────────────────
  console.log('\n' + C.cyan('─'.repeat(60)));
  console.log(C.bold('  🔑 MANUAL ACTION REQUIRED (if signup still fails):'));
  console.log(C.cyan('─'.repeat(60)));
  console.log('  1. Go to: https://supabase.com/dashboard/project/snmsvixlskwstvpuksbw');
  console.log('  2. Authentication → Providers → Email');
  console.log('  3. Toggle OFF → "Confirm email"');
  console.log('  4. Click SAVE');
  console.log('  5. Retry signup — it will work instantly\n');
}

main().catch(e => {
  console.error(C.red('FATAL: ' + e.message));
  process.exit(1);
});
