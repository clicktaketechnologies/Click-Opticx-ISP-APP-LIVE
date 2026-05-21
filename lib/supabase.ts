import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = typeof import.meta.env !== 'undefined' ? (import.meta.env.VITE_SUPABASE_URL as string) : (process.env.VITE_SUPABASE_URL as string);
const SUPABASE_ANON_KEY = typeof import.meta.env !== 'undefined' ? (import.meta.env.VITE_SUPABASE_ANON_KEY as string) : (process.env.VITE_SUPABASE_ANON_KEY as string);

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[SUPABASE] Missing env vars. Client will be unavailable.');
}

// Singleton client — safe to import anywhere in the frontend
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder',
  {
    auth: {
      persistSession: true,
      storageKey: 'clickopticx_sb_session',
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
);

/** Quick health check — resolves true if Supabase is reachable */
export async function checkSupabaseHealth(): Promise<boolean> {
  try {
    const { error } = await supabase.from('system_configs').select('key').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default supabase;
