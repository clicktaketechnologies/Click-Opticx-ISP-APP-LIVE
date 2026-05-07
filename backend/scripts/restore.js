import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://snmsvixlskwstvpuksbw.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubXN2aXhsc2t3c3R2cHVrc2J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQzODQ1MCwiZXhwIjoyMDkzMDE0NDUwfQ.HfBWcWlc5kwT9ydE_cEA03UQ7l-_eSp1gertCe0YqSE";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function restore() {
  console.log("Reverting migration to firebase_only using Service Role Key...");
  const newConfig = {
    migration_mode: 'firebase_only',
    dual_write_enabled: false,
    firebase_writes_enabled: true,
    supabase_reads_enabled: false,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('system_configs')
    .upsert({ key: 'migration_control', value: newConfig, updated_at: new Date().toISOString() }, { onConflict: 'key' });

  if (error) {
    console.error("Failed to restore migration:", error.message);
  } else {
    console.log("Successfully restored system to Firebase-primary (Database migration reverted).");
  }
}

restore();
