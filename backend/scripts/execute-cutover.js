require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const logger = require('../utils/logger');

async function executeCutover() {
  logger.info('🚀 INITIATING FINAL CUTOVER TO SUPABASE...');

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const cutoverConfig = {
    dual_write_enabled: true,
    firebase_mode: 'readonly',
    primary_source: 'supabase',
    phase: 3,
    started_at: new Date().toISOString(),
    notes: 'Phase 3 - Migration Complete. Supabase is Primary.'
  };

  try {
    const { error } = await supabase
      .from('system_configs')
      .upsert({ 
        key: 'migration_control', 
        value: cutoverConfig,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) throw error;

    logger.info('✅ SUCCESS: System is now running on Supabase Primary!');
    logger.info('🔥 Firebase is now in READ-ONLY mode.');
    
    process.exit(0);
  } catch (err) {
    logger.error(`❌ CUTOVER FAILED: ${err.message}`);
    process.exit(1);
  }
}

executeCutover();
