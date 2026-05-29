import configManager from '../../services/config-manager.js';
import logger from '../../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Supabase Auth Service
 * Wraps Supabase Auth operations for the ISP app
 */

export async function signUp({ email, password, phone, metadata }) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  if (supabase.auth.admin) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      phone,
      phone_confirm: !!phone,
      user_metadata: metadata || {}
    });
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    }
  });

  if (error) throw error;
  return data;
}

export async function signIn({ email, phone, password }) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const credentials = email ? { email, password } : { phone, password };
  const { data, error } = await supabase.auth.signInWithPassword(credentials);

  if (error) throw error;
  return data;
}

export async function resetPassword(email) {
  const supabase = configManager.getSupabaseClient();
  if (!supabase) throw new Error('Supabase client not initialized');

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/recovery`,
  });

  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword) {
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
export async function syncUserToPostgres(userData) {
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

export default {
  signUp,
  signIn,
  resetPassword,
  updatePassword,
  syncUserToPostgres
};
