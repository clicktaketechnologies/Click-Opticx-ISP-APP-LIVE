require('dotenv').config();
const admin = require('firebase-admin');
const configManager = require('../services/config-manager');
const logger = require('../utils/logger');

/**
 * Force Final Sync: Firebase → Supabase
 * ──────────────────────────────────────────────────────────────────────────
 * This is Step 4 of the cutover sequence. Reads the latest master_state
 * from Firestore and force-upserts every array into the corresponding
 * Supabase table, ensuring 100% parity before Firebase is set to readonly.
 *
 * Usage: node scripts/force-final-sync.js
 */

const TABLE_MAP = [
  { key: 'users', table: 'users' },
  { key: 'staff', table: 'staff' },
  { key: 'packages', table: 'packages' },
  { key: 'invoices', table: 'invoices' },
  { key: 'payments', table: 'payments' },
  { key: 'signupRequests', table: 'signup_requests' },
  { key: 'kycRequests', table: 'kyc_requests' },
  { key: 'kycFiles', table: 'kyc_files' },
  { key: 'topupRequests', table: 'topup_requests' },
  { key: 'emergencyLoads', table: 'emergency_loads' },
  { key: 'tickets', table: 'support_tickets' },
  { key: 'nasConfigs', table: 'nas_configs' },
  { key: 'oltConfigs', table: 'olt_nodes' },
  { key: 'onus', table: 'onus' },
  { key: 'networkNodes', table: 'network_nodes' },
  { key: 'nocAlerts', table: 'noc_alerts' },
  { key: 'emailLogs', table: 'email_logs' },
  { key: 'auditLogs', table: 'audit_logs' },
  { key: 'securityLogs', table: 'security_logs' },
  { key: 'systemSnapshots', table: 'system_snapshots' },
  { key: 'referralRecords', table: 'referrals' },
  { key: 'creditScoreLogs', table: 'credit_logs' },
  { key: 'supportTickets', table: 'support_tickets' },
  { key: 'internalTasks', table: 'internal_tasks' },
];

const CHUNK_SIZE = 100;

async function forceSync() {
  logger.info('🔄 FORCE FINAL SYNC: Starting Firebase → Supabase full migration');

  // 1. Init Firebase
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

  // 2. Init Supabase
  await configManager.init();
  const supabase = configManager.getSupabaseClient();
  if (!supabase) {
    logger.error('❌ Supabase client not available. Cannot sync.');
    process.exit(1);
  }

  // 3. Fetch Firebase master_state
  const db = admin.firestore();
  const doc = await db.collection('registry').doc('master_state').get();
  if (!doc.exists) {
    logger.error('❌ master_state document not found.');
    process.exit(1);
  }

  const fbData = doc.data();
  const results = [];

  // 4. Sync each collection
  for (const mapping of TABLE_MAP) {
    const items = fbData[mapping.key];
    if (!Array.isArray(items) || items.length === 0) {
      logger.info(`   ⏭️  [${mapping.key}] — Empty or not an array, skipping`);
      results.push({ collection: mapping.key, table: mapping.table, status: 'skipped', count: 0 });
      continue;
    }

    logger.info(`   🔄 [${mapping.key}] → ${mapping.table}: ${items.length} records...`);

    let successCount = 0;
    let errorCount = 0;

    // Transform rows with basic snake_case and raw_data preservation
    const transformed = items.map(row => {
      const id = row.id || row._id || `gen-${Math.random().toString(36).substr(2, 9)}`;
      
      const base = {
        id: id,
        updated_at: new Date().toISOString(),
      };

      // Add raw_data only for tables that support it
      const tablesWithRawData = ['users', 'staff', 'packages', 'signup_requests', 'kyc_requests', 'invoices', 'payments', 'emergency_loads', 'topup_requests', 'support_tickets', 'onus', 'noc_alerts', 'audit_logs', 'kyc_files'];
      if (tablesWithRawData.includes(mapping.table)) {
        base.raw_data = row;
      }

      // Map specific fields with fallbacks for common Firebase variations
      const mapped = {
        ...base,
        ...( (row.name || row.displayName) !== undefined && { name: row.name || row.displayName }),
        ...( (row.email || row.userEmail) !== undefined && { email: row.email || row.userEmail }),
        ...( (row.phone || row.phoneNumber) !== undefined && { phone: row.phone || row.phoneNumber }),
        ...( row.status !== undefined && { status: row.status }),
        ...( (row.userId || row.uid || row.user_id) !== undefined && { user_id: row.userId || row.uid || row.user_id }),
        ...( (row.role || row.userRole) !== undefined && { role: row.role || row.userRole }),
        ...( row.userName !== undefined && { user_name: row.userName }),
        ...( (row.createdAt || row.timestamp) !== undefined && { created_at: row.createdAt || row.timestamp }),
      };

      // Add table-specific fields
      if (mapping.table === 'kyc_files') {
        mapped.file_name = row.fileName || row.name || 'unnamed_file';
      }
      if (mapping.table === 'audit_logs') {
        mapped.action = row.action || row.type || 'unknown_action';
      }

      return mapped;
    });

    // Batch upsert in chunks
    for (let i = 0; i < transformed.length; i += CHUNK_SIZE) {
      const chunk = transformed.slice(i, i + CHUNK_SIZE);
      try {
        const { error } = await supabase
          .from(mapping.table)
          .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          logger.error(`   ❌ [${mapping.table}] Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${error.message}`);
          errorCount += chunk.length;
        } else {
          successCount += chunk.length;
        }
      } catch (e) {
        logger.error(`   ❌ [${mapping.table}] Chunk error: ${e.message}`);
        errorCount += chunk.length;
      }
    }

    const status = errorCount === 0 ? 'success' : (successCount > 0 ? 'partial' : 'failed');
    logger.info(`   ✅ [${mapping.table}] Done: ${successCount} synced, ${errorCount} errors`);
    results.push({ collection: mapping.key, table: mapping.table, status, count: successCount, errors: errorCount });
  }

  // 5. Log results to migration_stats
  const batchId = `FORCE-SYNC-${Date.now()}`;
  for (const r of results) {
    if (r.status === 'skipped') continue;
    await supabase.from('migration_stats').insert({
      batch_id: batchId,
      collection: r.collection,
      total_count: r.count + (r.errors || 0),
      synced_count: r.count,
      mismatch_count: r.errors || 0,
      mismatch_ids: [],
      last_validated: new Date().toISOString()
    });
  }

  // 6. Summary
  const totalSynced = results.reduce((acc, r) => acc + r.count, 0);
  const totalErrors = results.reduce((acc, r) => acc + (r.errors || 0), 0);
  logger.info(`\n🏁 FORCE SYNC COMPLETE`);
  logger.info(`   Total Records Synced: ${totalSynced}`);
  logger.info(`   Total Errors: ${totalErrors}`);
  logger.info(`   Batch ID: ${batchId}`);

  process.exit(totalErrors > 0 ? 1 : 0);
}

forceSync().catch(err => {
  logger.error(`❌ Force sync failed: ${err.message}`);
  process.exit(1);
});
