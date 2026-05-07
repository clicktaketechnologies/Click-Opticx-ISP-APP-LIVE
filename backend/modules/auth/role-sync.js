import configManager from '../../services/config-manager.js';
import logger from '../../utils/logger.js';

/**
 * Syncs user roles to the Supabase user_roles table
 * This enables Row-Level Security (RLS) enforcement at the DB level
 */
export async function syncUserRole(userId, role, grantedBy = 'system') {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: role,
        granted_by: grantedBy,
        created_at: new Date().toISOString()
      }, { onConflict: 'user_id, role' });

    if (error) {
      logger.error(`[ROLE-SYNC] Failed to sync role for ${userId}: ${error.message}`);
    } else {
      logger.info(`[ROLE-SYNC] Synced role "${role}" for user ${userId}`);
    }
  } catch (e) {
    logger.error(`[ROLE-SYNC] Critical error syncing role for ${userId}: ${e.message}`);
  }
}

/**
 * Revokes a role from a user
 */
export async function revokeUserRole(userId, role) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .match({ user_id: userId, role: role });

    if (error) logger.error(`[ROLE-SYNC] Failed to revoke role for ${userId}: ${error.message}`);
  } catch (e) {
    logger.error(`[ROLE-SYNC] Critical error revoking role for ${userId}: ${e.message}`);
  }
}

export default {
  syncUserRole,
  revokeUserRole
};
