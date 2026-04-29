const logger = require('../../utils/logger');
const configManager = require('../../services/config-manager');
const processor = require('./processor');
const cloudinary = require('./providers/cloudinary');
const supabaseStorage = require('./providers/supabase-storage');

const providers = {
  cloudinary,
  supabase_storage: supabaseStorage,
  local: null // Existing local behavior
};

/**
 * Storage Router
 * Handles multi-provider upload failover and replication
 */
async function uploadFile(file, options = {}) {
  const config = configManager.getConfig('storage_providers');
  if (!config) {
    logger.warn('[STORAGE-ROUTER] No configuration found. Using default behavior.');
    return { success: true, url: `/uploads/kyc/${file.filename}`, provider: 'local' };
  }

  // 1. Pre-process file (compression, checksum)
  const processed = await processor.processFile(file, config);
  
  const sortedProviders = [...(config.providers || [])]
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);

  if (sortedProviders.length === 0) {
    return { success: true, url: `/uploads/kyc/${file.filename}`, provider: 'local' };
  }

  let primaryResult = null;
  let lastError = null;

  // 2. Primary Upload
  for (const providerConfig of sortedProviders) {
    const providerId = providerConfig.id;
    const provider = providers[providerId];

    if (!provider) continue;

    try {
      logger.info(`[STORAGE-ROUTER] Uploading to ${providerId}...`);
      primaryResult = await provider.upload({
        path: processed.path,
        name: file.originalname,
        mimetype: file.mimetype,
        userId: options.userId
      }, options);

      primaryResult.checksum = processed.checksum;
      break; // Success!
    } catch (error) {
      logger.error(`[STORAGE-ROUTER] ${providerId} failed: ${error.message}`);
      lastError = error;
    }
  }

  if (!primaryResult) {
    throw new Error(`All storage providers failed. Last error: ${lastError?.message}`);
  }

  // 3. Async Replication to Backups
  replicateToBackups(processed, options, primaryResult.provider, sortedProviders).catch(err => {
    logger.error(`[STORAGE-ROUTER] Replication failed: ${err.message}`);
  });

  return primaryResult;
}

/**
 * Replicate file to other enabled providers in the background
 */
async function replicateToBackups(processed, options, primaryProviderId, allProviders) {
  const backups = allProviders.filter(p => p.enabled && p.id !== primaryProviderId);
  
  for (const backupConfig of backups) {
    const provider = providers[backupConfig.id];
    if (!provider) continue;

    try {
      logger.info(`[STORAGE-ROUTER] Replicating to backup: ${backupConfig.id}...`);
      await provider.upload({
        path: processed.path,
        name: options.fileName || 'backup',
        mimetype: options.mimetype || 'image/jpeg',
        userId: options.userId
      }, options);
    } catch (e) {
      logger.error(`[STORAGE-ROUTER] Backup to ${backupConfig.id} failed: ${e.message}`);
    }
  }
}

module.exports = { uploadFile };
