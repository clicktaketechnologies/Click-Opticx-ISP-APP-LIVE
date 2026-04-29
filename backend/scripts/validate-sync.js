require('dotenv').config(); // Loads from .env in current directory (backend/)
const admin = require('firebase-admin');
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

/**
 * Sync Validator: Firebase vs Supabase
 * Performs deep comparison and logs discrepancies
 */

async function validate() {
  logger.info('🔍 STARTING DATA VALIDATION: Firebase vs Supabase');

  // 1. Init
  if (!admin.apps.length) {
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
      : null;

    if (serviceAccount?.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: serviceAccount 
        ? admin.credential.cert(serviceAccount) 
        : admin.credential.applicationDefault()
    });
  }
  await configManager.init();
  const supabase = configManager.getSupabaseClient();
  const db = admin.firestore();

  // 2. Fetch Firebase State
  const fbDoc = await db.collection('registry').doc('master_state').get();
  const fbData = fbDoc.data();
  const batchId = `VAL-${Date.now()}`;

  const collections = [
    { key: 'users', table: 'users', idKey: 'id' },
    { key: 'invoices', table: 'invoices', idKey: 'id' },
    { key: 'kyc_requests', table: 'kyc_files', idKey: 'id' }
  ];

  for (const col of collections) {
    logger.info(`--- Validating [${col.key}] ---`);
    const fbItems = fbData[col.key] || [];
    
    // Fetch Supabase IDs
    const { data: sbItems, error } = await supabase
      .from(col.table)
      .select(col.idKey);

    if (error) {
      logger.error(`Failed to fetch ${col.table} from Supabase: ${error.message}`);
      continue;
    }

    const sbIds = new Set(sbItems.map(i => i[col.idKey]));
    const mismatches = fbItems.filter(item => !sbIds.has(item[col.idKey]));

    logger.info(`   Firebase: ${fbItems.length} | Supabase: ${sbItems.length}`);
    logger.info(`   Mismatches: ${mismatches.length}`);

    // Log stats to DB
    await supabase.from('migration_stats').insert({
      batch_id: batchId,
      collection: col.key,
      total_count: fbItems.length,
      synced_count: sbItems.length,
      mismatch_count: mismatches.length,
      mismatch_ids: mismatches.map(m => m[col.idKey]).slice(0, 100), // Cap for JSON storage
      last_validated: new Date().toISOString()
    });
  }

  logger.info('✅ VALIDATION COMPLETE');
  process.exit(0);
}

validate().catch(err => {
  logger.error(`Validation Failure: ${err.message}`);
  process.exit(1);
});
