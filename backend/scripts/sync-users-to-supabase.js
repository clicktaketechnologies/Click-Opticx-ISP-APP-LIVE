require('dotenv').config({ path: '../.env' });
const admin = require('firebase-admin');
const supabaseAuth = require('../modules/auth/supabase-auth');
const roleSync = require('../modules/auth/role-sync');
const logger = require('../utils/logger');
const configManager = require('../services/config-manager');

/**
 * Migration Script: Firebase -> Supabase PostgreSQL (Users)
 * This script catches up the existing user registry to the new Supabase tables.
 */

async function runMigration() {
  logger.info('🚀 STARTING USER MIGRATION: Firebase -> Supabase');

  // 1. Init Firebase
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH))
    });
  }

  // 2. Init Config Manager (Supabase)
  await configManager.init();
  
  const db = admin.firestore();
  logger.info('📡 Fetching master state from Firebase...');
  
  const doc = await db.collection('registry').doc('master_state').get();
  if (!doc.exists) {
    logger.error('❌ Master state document not found in Firebase');
    return;
  }

  const { users = [], staff = [] } = doc.data();
  const allUsers = [...users, ...staff];
  
  logger.info(`📊 Found ${allUsers.length} total users/staff to sync.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < allUsers.length; i++) {
    const user = allUsers[i];
    const progress = Math.round(((i + 1) / allUsers.length) * 100);

    try {
      // Sync basic profile
      await supabaseAuth.syncUserToPostgres(user);
      
      // Sync role for RLS
      await roleSync.syncUserRole(user.id, user.role);

      successCount++;
      if ((i + 1) % 10 === 0 || i === allUsers.length - 1) {
        logger.info(`[PROGRESS] ${progress}% - Synced ${i + 1}/${allUsers.length} users...`);
      }
    } catch (err) {
      failCount++;
      logger.error(`[MIGRATION-ERROR] Failed to sync ${user.id} (${user.email}): ${err.message}`);
    }
  }

  logger.info('─────────────────────────────────────────');
  logger.info(`✅ MIGRATION COMPLETE`);
  logger.info(`   Success: ${successCount}`);
  logger.info(`   Failed:  ${failCount}`);
  logger.info('─────────────────────────────────────────');
  
  process.exit(0);
}

runMigration().catch(err => {
  logger.error(`[CRITICAL-MIGRATION-FAILURE] ${err.message}`);
  process.exit(1);
});
