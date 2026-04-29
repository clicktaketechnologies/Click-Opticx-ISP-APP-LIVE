const configManager = require('../../services/config-manager');
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');

/**
 * Supabase Auth Service
 * Wraps Supabase Auth operations for the ISP app
 */

async function signUp({ email, password, phone, metadata }) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    phone,
    options: {
      data: metadata || {},
    }
  });

  if (error) throw error;
  return data;
}

async function signIn({ email, phone, password }) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const credentials = email ? { email, password } : { phone, password };
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data;
}

async function resetPassword(email) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recovery`,
  });

  if (error) throw error;
  return data;
}

async function updatePassword(newPassword) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) throw error;
  return data;
}

/**
 * Syncs a user to the Supabase 'users' table
 * This is used for the dual-write pattern during migration
 */
async function syncUserToPostgres(userData) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('users')
      .upsert({
        id: userData.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        username: userData.username,
        role: userData.role,
        status: userData.status,
        raw_data: userData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (error) logger.error(`[AUTH-SYNC] Failed to sync user ${userData.id}: ${error.message}`);
  } catch (e) {
    logger.error(`[AUTH-SYNC] Critical error syncing user ${userData.id}: ${e.message}`);
  }
}

module.exports = {
  signUp,
  signIn,
  resetPassword,
  updatePassword,
  syncUserToPostgres
};
