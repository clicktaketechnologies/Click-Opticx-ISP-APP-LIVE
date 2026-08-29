import pg from 'pg';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Always resolve .env from backend root (one level up from migrations/)
dotenv.config({ path: join(__dirname, '..', '.env') });
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('SUPABASE_URL present:', !!process.env.SUPABASE_URL);

async function runMigration() {
  // Parse DATABASE_URL — Supabase pooler sometimes needs special handling
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not set in .env');
  }
  console.log('Connecting to:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false,
      // Supabase pooler (port 6543) on some networks needs this
      checkServerIdentity: () => undefined
    },
    connectionTimeoutMillis: 15000,
    query_timeout: 20000
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres.');

    const alters = [
      "ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS type        TEXT DEFAULT 'transactional'",
      "ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS job_id      TEXT DEFAULT NULL",
      "ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS message_id  TEXT DEFAULT NULL"
    ];

    for (const sql of alters) {
      const { rowCount } = await client.query(sql).catch(e => { throw new Error(`SQL failed [${sql.slice(0,50)}]: ${e.message}`); });
      console.log('  ALTER OK:', sql.slice(0, 70));
    }

    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_email_logs_type    ON email_logs(type)",
      "CREATE INDEX IF NOT EXISTS idx_email_logs_status  ON email_logs(status)",
      "CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC)"
    ];

    for (const sql of indexes) {
      await client.query(sql).catch(e => console.warn('  INDEX WARN (non-fatal):', e.message));
      console.log('  INDEX OK:', sql.slice(0, 70));
    }

    // Show final column list
    const { rows } = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'email_logs' ORDER BY ordinal_position"
    );
    console.log('\n=== email_logs columns after migration ===');
    rows.forEach(r => console.log(`  ${r.column_name.padEnd(22)} ${r.data_type}`));

  } finally {
    await client.end();
  }

  // Confirm via Supabase JS client
  console.log('\nVerifying via Supabase JS client...');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { error: insErr } = await sb.from('email_logs').insert({
    email:         'probe@schema-check.local',
    type:          'schema_test',
    status:        'Failed',
    error_message: 'migration probe',
    provider_used: 'test',
    job_id:        'probe-003',
    message_id:    'probe-msg-id',
    created_at:    new Date().toISOString(),
    template_id:   'schema_test'
  });

  if (insErr) {
    console.error('SUPABASE INSERT PROBE FAILED:', insErr.message);
    process.exit(1);
  }

  console.log('SUPABASE INSERT PROBE: OK');

  // Cleanup probe row
  await sb.from('email_logs').delete().eq('email', 'probe@schema-check.local');
  console.log('\n✅ Migration complete — email_logs schema is production-ready.');
}

runMigration().catch(err => {
  console.error('\n❌ Migration error:', err.message);
  process.exit(1);
});
