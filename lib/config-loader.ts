/**
 * config-loader.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Frontend Runtime Config Loader
 *
 * Reads system_configs from Supabase and keeps them in memory.
 * Subscribes to Realtime updates so provider priority changes made in the
 * Admin Config page are reflected immediately without a page reload.
 */

import supabase from './supabase';

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
type ConfigCache = Record<string, any>;
let cache: ConfigCache = {};
let initialized = false;
const listeners: Array<(key: string, value: any) => void> = [];

// ─── Initialize ───────────────────────────────────────────────────────────────
export async function initConfigLoader(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('system_configs')
      .select('key, value');

    if (error) {
      console.warn('[CONFIG] Failed to load from Supabase, using defaults:', error.message);
    } else if (data) {
      data.forEach(({ key, value }) => {
        cache[key] = value;
      });
      console.log('[CONFIG] Loaded', data.length, 'config keys from Supabase');
    }

    // Subscribe to live updates
    supabase
      .channel('config_realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'system_configs',
      }, (payload: any) => {
        const key = payload.new?.key || payload.old?.key;
        const value = payload.new?.value;
        if (key) {
          cache[key] = value;
          console.log('[CONFIG] Live update received:', key);
          listeners.forEach((cb) => cb(key, value));
        }
      })
      .subscribe();

    initialized = true;
  } catch (e) {
    console.warn('[CONFIG] Init failed, continuing with defaults:', e);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get a config value by key. Returns defaultValue if not loaded yet. */
export function getConfig<T = any>(key: string, defaultValue?: T): T {
  return key in cache ? (cache[key] as T) : (defaultValue as T);
}

/** Get all configs */
export function getAllConfigs(): ConfigCache {
  return { ...cache };
}

/** Subscribe to config changes */
export function onConfigChange(cb: (key: string, value: any) => void): () => void {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

/** Update a config value (admin action — writes to Supabase) */
export async function setConfig(key: string, value: any, updatedBy?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Save old value for history
    const oldValue = cache[key];

    const { error } = await supabase
      .from('system_configs')
      .upsert({ key, value, updated_by: updatedBy, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };

    // Log to config_history
    await supabase.from('config_history').insert({
      config_key: key,
      old_value: oldValue || null,
      new_value: value,
      changed_by: updatedBy || 'unknown',
      changed_at: new Date().toISOString(),
    });

    cache[key] = value; // Optimistic update
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Rollback a config key to a previous version */
export async function rollbackConfig(key: string, historyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data } = await supabase
      .from('config_history')
      .select('old_value')
      .eq('id', historyId)
      .single();

    if (!data?.old_value) return { success: false, error: 'History entry not found' };
    return setConfig(key, data.old_value, 'rollback');
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/** Get history for a config key (last 10 changes) */
export async function getConfigHistory(key: string) {
  const { data } = await supabase
    .from('config_history')
    .select('*')
    .eq('config_key', key)
    .order('changed_at', { ascending: false })
    .limit(10);
  return data || [];
}

export function isConfigLoaded(): boolean {
  return initialized;
}
