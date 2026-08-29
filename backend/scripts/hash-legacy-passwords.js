/**
 * hash-legacy-passwords.js — ONE-TIME remediation for the plaintext-password era.
 *
 * WHY THIS EXISTS
 * ---------------
 * Before the security fixes, this app stored and compared passwords in
 * PLAINTEXT in the `users` and `staff` tables. The fixed login only accepts
 * bcrypt/argon2 hashes or Supabase Auth. Any account whose DB password is
 * still plaintext is now locked out with 401 INVALID_CREDENTIALS.
 *
 * WHAT THIS SCRIPT DOES
 * ---------------------
 * 1. Scans `users` and `staff` for rows whose `password` is NOT a
 *    bcrypt/argon2 hash (i.e. legacy plaintext).
 * 2. For each: writes the same password into Supabase Auth (create or reset),
 *    so both systems agree, THEN replaces the DB value with a bcrypt hash.
 *    Order matters: plaintext is needed for the Auth sync and is never logged.
 * 3. Rows already holding a hash are counted and skipped.
 *
 * RESULT: every legacy account keeps its existing password but is now backed
 * by a proper hash + Supabase Auth identity — secure AND able to log in.
 *
 * USAGE (run from the backend/ directory so dotenv picks up backend/.env):
 *   node scripts/hash-legacy-passwords.js            # DRY RUN — reports only
 *   node scripts/hash-legacy-passwords.js --apply    # performs the updates
 *
 * ENV REQUIRED: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const APPLY = process.argv.includes('--apply');
const BCRYPT_ROUNDS = 10;
const isHash = (p) =>
    typeof p === 'string' &&
    (p.startsWith('$2a$') || p.startsWith('$2b$') || p.startsWith('$2y$') || p.startsWith('$argon2'));

async function fetchAll(supabase, table) {
    const PAGE = 1000;
    let from = 0, rows = [];
    for (;;) {
        const { data, error } = await supabase.from(table).select('id,email,username,password,role').range(from, from + PAGE - 1);
        if (error) throw new Error(`[${table}] ${error.message}`);
        if (!data || data.length === 0) break;
        rows = rows.concat(data);
        if (data.length < PAGE) break;
        from += PAGE;
    }
    return rows;
}

async function syncToSupabaseAuth(supabase, email, plaintext) {
    // Try create; if the identity already exists, reset its password instead.
    const { error: createErr } = await supabase.auth.admin.createUser({
        email, password: plaintext, email_confirm: true,
    });
    if (!createErr) return 'auth-created';
    if (/already|exists|registered/i.test(createErr.message || '')) {
        const { error: updErr } = await supabase.auth.admin.updateUserByEmail(email, { password: plaintext });
        if (updErr) throw new Error(`auth-update: ${updErr.message}`);
        return 'auth-updated';
    }
    throw new Error(`auth-create: ${createErr.message}`);
}

async function processTable(supabase, table) {
    const rows = await fetchAll(supabase, table);
    const legacy = rows.filter((r) => typeof r.password === 'string' && r.password.length > 0 && !isHash(r.password));
    const noPassword = rows.filter((r) => !r.password).length;
    console.log(`\n=== ${table}: ${rows.length} rows | ${legacy.length} legacy plaintext | ${rows.length - legacy.length - noPassword} already hashed | ${noPassword} empty ===`);

    let ok = 0, failed = 0;
    for (const row of legacy) {
        const label = row.email || row.username || row.id;
        if (!row.email) {
            console.log(`  SKIP ${label} — no email, cannot sync Supabase Auth (hash locally only)`);
        }
        try {
            if (APPLY) {
                if (row.email) await syncToSupabaseAuth(supabase, row.email, row.password);
                const hash = await bcrypt.hash(row.password, BCRYPT_ROUNDS);
                const { error: updErr } = await supabase.from(table).update({ password: hash }).eq('id', row.id);
                if (updErr) throw new Error(`db-update: ${updErr.message}`);
            }
            ok++;
            console.log(`  ${APPLY ? 'FIXED' : 'WOULD FIX'} ${label}${row.email ? '' : ' (db-only)'}`);
        } catch (e) {
            failed++;
            console.error(`  FAILED ${label}: ${e.message}`);
        }
    }
    return { total: rows.length, legacy: legacy.length, ok, failed };
}

(async () => {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Run from backend/ with a valid .env');
        process.exit(1);
    }
    console.log(`Click Opticx — legacy password remediation | mode: ${APPLY ? 'APPLY (writes)' : 'DRY RUN (no writes)'}`);
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const results = {};
    try { results.users = await processTable(supabase, 'users'); } catch (e) { console.error(`users table: ${e.message}`); }
    try { results.staff = await processTable(supabase, 'staff'); } catch (e) { console.error(`staff table: ${e.message}`); }

    console.log('\nSUMMARY', JSON.stringify(results, null, 2));
    if (!APPLY) console.log('\nDry run only. Re-run with --apply to write fixes.');
    process.exit(0);
})();
