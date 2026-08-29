require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Firebase Cold Backup Export
 * ──────────────────────────────────────────────────────────────────────────
 * Exports the entire master_state document from Firestore to a timestamped
 * JSON file. This is a pre-cutover safety net — a complete cold backup.
 *
 * Usage: node scripts/export-firebase-backup.js
 */

async function exportBackup() {
  logger.info('📦 FIREBASE BACKUP: Starting full export of master_state...');

  // 1. Init Firebase Admin
  if (!admin.apps.length) {
    let serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : null;

    if (serviceAccount?.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!serviceAccount && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      logger.error('❌ No Firebase credentials found. Cannot export.');
      process.exit(1);
    }

    admin.initializeApp({
      credential: serviceAccount
        ? admin.credential.cert(serviceAccount)
        : admin.credential.applicationDefault()
    });
  }

  const db = admin.firestore();

  // 2. Fetch the full master_state
  const doc = await db.collection('registry').doc('master_state').get();
  if (!doc.exists) {
    logger.error('❌ master_state document not found in Firestore.');
    process.exit(1);
  }

  const data = doc.data();

  // 3. Build export summary
  const summary = {};
  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      summary[key] = value.length;
    } else if (typeof value === 'object' && value !== null) {
      summary[key] = 'object';
    } else {
      summary[key] = typeof value;
    }
  }

  logger.info('📊 Export Summary:');
  for (const [key, count] of Object.entries(summary)) {
    logger.info(`   ${key}: ${count}`);
  }

  // 4. Write to timestamped file
  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `firebase-backup-${timestamp}.json`;
  const filepath = path.join(backupDir, filename);

  const exportData = {
    _meta: {
      exportedAt: new Date().toISOString(),
      source: 'Firestore registry/master_state',
      recordCounts: summary,
      version: '1.0.0'
    },
    data
  };

  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

  const fileSizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2);
  logger.info(`✅ BACKUP COMPLETE: ${filename} (${fileSizeMB} MB)`);
  logger.info(`   Path: ${filepath}`);

  process.exit(0);
}

exportBackup().catch(err => {
  logger.error(`❌ Backup failed: ${err.message}`);
  process.exit(1);
});
