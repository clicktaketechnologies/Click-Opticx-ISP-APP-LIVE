/**
 * config-manager.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Backend Runtime Config Manager
 */

import { createClient } from '@supabase/supabase-js';

let supabase = null;
let cache = {};
let initialized = false;
const listeners = {};

// ─── Initialize ───────────────────────────────────────────────────────────────
export async function init() {
  const supabaseUrl = process.env.SUPABASE_URL;
  // Accept both common spellings so local setups following older docs still work
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      '[CONFIG-MGR] Supabase env vars missing (need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY). ' +
      'All /api/auth/* and DB-backed endpoints will fail until these are set. ' +
      'See backend/.env.example.'
    );
    initialized = true;
    return;
  }

  // Handle service account private key newlines
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (sa.private_key) sa.private_key = sa.private_key.replace(/\\n/g, '\n');
      process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify(sa);
    } catch (e) {}
  }

  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 2 } },
  });

  // Non-blocking background configuration load
  supabase
    .from('system_configs')
    .select('key, value')
    .then(({ data, error }) => {
      if (error) {
        console.warn('[CONFIG-MGR] Failed to load configs:', error.message);
      } else {
        (data || []).forEach(({ key, value }) => { cache[key] = value; });
        console.log(`[CONFIG-MGR] Loaded ${Object.keys(cache).length} config keys`);
      }
    })
    .catch(e => console.error('[CONFIG-MGR] Background init error:', e.message));

  // Subscribe to Realtime updates (immediately)
  supabase
    .channel('config_backend_watch')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'system_configs',
    }, (payload) => {
      const key = payload.new?.key || payload.old?.key;
      const value = payload.new?.value;
      if (key) {
        const old = cache[key];
        cache[key] = value;
        console.log(`[CONFIG-MGR] Live update: "${key}"`);
        if (listeners[key]) {
          listeners[key].forEach(cb => { try { cb(value, old); } catch (e) {} });
        }
        if (listeners['*']) {
          listeners['*'].forEach(cb => { try { cb(key, value, old); } catch (e) {} });
        }
      }
    })
    .subscribe();

  initialized = true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get a config value by key */
export function getConfig(key, defaultValue = null) {
  return key in cache ? cache[key] : defaultValue;
}

/** Get all configs */
export function getAllConfigs() {
  return { ...cache };
}

/** Update a config value */
export async function setConfig(key, value, updatedBy = 'system') {
  if (!supabase) return { success: false, error: 'Supabase not initialized' };
  try {
    const oldValue = cache[key];

    const { error } = await supabase
      .from('system_configs')
      .upsert({ key, value, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };

    // Log history
    await supabase.from('config_history').insert({
      config_key: key,
      old_value: oldValue ?? null,
      new_value: value,
      changed_by: updatedBy,
      changed_at: new Date().toISOString(),
    });

    cache[key] = value;
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/** Subscribe to changes on a specific key ('*' for all) */
export function onConfigChange(key, cb) {
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(cb);
  return () => {
    listeners[key] = (listeners[key] || []).filter(fn => fn !== cb);
  };
}

/** Test a provider connection */
export async function testProvider(providerType, providerId) {
  const config = getConfig(`${providerType}_providers`);
  const provider = (config?.providers || []).find(p => p.id === providerId);
  if (!provider) return { success: false, error: 'Provider not found in config' };
  return { success: true, provider, message: `Provider "${providerId}" config found. Live test available from dedicated endpoint.` };
}

export function isReady() { return initialized; }
export function getSupabaseClient() {
  if (!supabase) {
    console.warn('[CONFIG-MGR] getSupabaseClient() called but Supabase is not initialized — check SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars.');
  }
  return supabase;
}

/** Throws a descriptive error when the Supabase admin client is unavailable. */
export function requireSupabaseClient() {
  if (!supabase) {
    const err = new Error('Database client unavailable: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars are not configured.');
    err.status = 503;
    err.code = 'DB_NOT_CONFIGURED';
    throw err;
  }
  return supabase;
}

export default { init, getConfig, getAllConfigs, setConfig, onConfigChange, testProvider, isReady, getSupabaseClient, requireSupabaseClient };
