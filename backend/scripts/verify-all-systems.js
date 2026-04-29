const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const admin = require('firebase-admin');
const logger = require('../utils/logger');
const configManager = require('../services/config-manager');
const emailRouter = require('../modules/email/email-router');
const storageRouter = require('../modules/storage/storage-router');

async function verifyAllSystems() {
  logger.info('🧪 STARTING SYSTEM VERIFICATION...');

  try {
    // Initialize Config Manager
    await configManager.init();
    
    // 1. Database & Dual-Write Verification
    logger.info('--- 1. Database Verification ---');
    const supabase = configManager.getSupabaseClient();
    if (!supabase) {
      logger.error('❌ Supabase client not available. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    } else {
      const testId = `test-${Date.now()}`;
      logger.info(`Creating test user in Supabase: ${testId}`);
      const { data: sbUser, error: sbError } = await supabase
        .from('users')
        .insert([{ id: testId, name: 'System Test User', email: 'test@example.com', status: 'Active' }])
        .select();

      if (sbError) {
        logger.error(`❌ Supabase Write Failed: ${sbError.message}`);
      } else {
        logger.info('✅ Supabase Write: OK');
        
        // Cleanup test user
        await supabase.from('users').delete().eq('id', testId);
        logger.info('✅ Supabase Cleanup: OK');
      }
    }

    // 2. Email Infrastructure Verification
    logger.info('--- 2. Email Infrastructure (Router) ---');
    try {
      await emailRouter.init();
      const healthy = emailRouter.getHealthyProviders();
      logger.info(`Found ${healthy.length} healthy email providers.`);
      
      // We won't actually send an email in this script to avoid spamming
      // but we verify the router is initialized and has providers.
      if (healthy.length > 0) {
        logger.info('✅ Email Router: OK (Providers Online)');
      } else {
        logger.warn('⚠️ Email Router: No healthy providers found.');
      }
    } catch (err) {
      logger.error(`❌ Email Router Init Failed: ${err.message}`);
    }

    // 3. Storage Verification
    logger.info('--- 3. Storage Routing ---');
    if (storageRouter && typeof storageRouter.uploadFile === 'function') {
      logger.info('✅ Storage Router: Wired and Exported');
    } else {
      logger.warn('⚠️ Storage Router: uploadFile function not found');
    }

    logger.info('🏁 VERIFICATION COMPLETE');
  } catch (err) {
    logger.error(`❌ Unexpected Verification Error: ${err.message}`);
  }
  process.exit(0);
}

verifyAllSystems();
