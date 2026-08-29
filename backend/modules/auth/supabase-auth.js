import { createClient } from '@supabase/supabase-js';
import configManager from '../../services/config-manager.js';
import logger from '../../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Supabase Auth Service
 * Wraps Supabase Auth operations for the ISP app
 */

function getAnonClient() {
  const supabaseUrl = process.env.SUPABASE_URL || 'https://snmsvixlskwstvpuksbw.supabase.co';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing from environment');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

// Timeout helper for Supabase calls
const timeoutPromise = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Supabase operation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
};

export async function signUp({ email, password, phone, metadata }) {
   const supabase = configManager.getSupabaseClient(); // Use admin client to skip builtin confirmation email

   try {
     const { data, error } = await timeoutPromise(
       supabase.auth.admin.createUser({
         email,
         password,
         email_confirm: true,
         user_metadata: metadata || {}
       }),
       10000 // 10 seconds timeout
     );

     if (error) throw error;
     return { user: data.user };
   } catch (err) {
     if (err.message.includes('timed out')) {
       logger.error(`[SIGNUP] Supabase Auth timeout: ${err.message}`);
       throw new Error('AUTH_TIMEOUT');
     }
     throw err;
   }
 }

export async function signIn({ email, phone, password }) {
   const supabase = getAnonClient();

   const credentials = email ? { email, password } : { phone, password };

   try {
     const { data, error } = await timeoutPromise(
       supabase.auth.signInWithPassword(credentials),
       10000 // 10 seconds timeout
     );

     if (error) throw error;
     return data;
   } catch (err) {
     if (err.message.includes('timed out')) {
       logger.error(`[SIGNIN] Supabase Auth timeout: ${err.message}`);
       throw new Error('AUTH_TIMEOUT');
     }
     throw err;
   }
 }

export async function resetPassword(email) {
   const supabase = getAnonClient();

   try {
     const { data, error } = await timeoutPromise(
       supabase.auth.resetPasswordForEmail(email, {
         redirectTo: `${process.env.FRONTEND_URL || 'https://isp-click-opticx.web.app'}/recovery`,
       }),
       10000 // 10 seconds timeout
     );

     if (error) throw error;
     return data;
   } catch (err) {
     if (err.message.includes('timed out')) {
       logger.error(`[RESET-PASSWORD] Supabase Auth timeout: ${err.message}`);
       throw new Error('AUTH_TIMEOUT');
     }
     throw err;
   }
 }

export async function updatePassword(newPassword) {
   const supabase = getAnonClient();

   try {
     const { data, error } = await timeoutPromise(
       supabase.auth.updateUser({
         password: newPassword
       }),
       10000 // 10 seconds timeout
     );

     if (error) throw error;
     return data;
   } catch (err) {
     if (err.message.includes('timed out')) {
       logger.error(`[UPDATE-PASSWORD] Supabase Auth timeout: ${err.message}`);
       throw new Error('AUTH_TIMEOUT');
     }
     throw err;
   }
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
