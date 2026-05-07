import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snmsvixlskwstvpuksbw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXN2aXhsc2t3c3R2cHVrc2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQzODQ1MCwiZXhwIjoyMDkzMDE0NDUwfQ.HfBWcWlc5kwT9ydE_cEA03UQ7l-_eSp1gertCe0YqSE";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function restore() {
  console.log("Restoring Supabase configuration to Phase 3 Cutover state...");
  const cutoverConfig = {
    migration_mode: 'supabase_primary',
    dual_write_enabled: true,
    firebase_writes_enabled: false,
    supabase_reads_enabled: true,
    primary_source: 'supabase',
    phase: 3,
    updated_at: new Date().toISOString(),
    notes: 'Phase 3 - Migration Complete. Supabase is Primary.'
  };

  const { error } = await supabase
    .from('system_configs')
    .upsert({ key: 'migration_control', value: cutoverConfig, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error("Failed to restore Supabase config:", error.message);
  } else {
    console.log("Successfully restored Supabase configuration.");
  }
}

restore();
