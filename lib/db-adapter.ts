/**
 * db-adapter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 0-3 Dual-Write / Cutover Adapter
 *
 * STRATEGY:
 *   Phase 0-2 (Dual-Write):
 *     • Firebase/Firestore is PRIMARY. Supabase mirrors async after commit().
 *   Phase 3 (Cutover):
 *     • Supabase becomes PRIMARY. Firebase writes are disabled.
 *     • Reads can be switched to Supabase via migration_control config.
 *   Rollback:
 *     • At any time, flip the config flag to revert to Firebase-primary instantly.
 *
 * USAGE (App.tsx):
 *   import { initDualWrite } from './lib/db-adapter';
 *   initDualWrite();   // Call once at app startup after db is ready
 */

import supabase from './supabase';
import { db } from '../db';
import type { AppState } from '../types';

// ─── Migration Modes ──────────────────────────────────────────────────────────
export type MigrationMode = 'dual_write' | 'supabase_primary' | 'firebase_only';

// ─── Config ───────────────────────────────────────────────────────────────────
let dualWriteActive = false;
let migrationMode: MigrationMode = 'firebase_only';
let firebaseWritesEnabled = true;
let supabaseReadsEnabled = false;
let lastSyncedState: Partial<AppState> = {};
let retryQueue: Array<{ table: string; rows: any[]; attempt: number }> = [];
let syncStats = { totalWrites: 0, failedWrites: 0, lastSyncAt: '', lastError: '' };
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const SYNC_DEBOUNCE_MS = 3000;

// ─── Bootstrap ────────────────────────────────────────────────────────────────
export function initDualWrite() {
  // Check runtime config from Supabase to see if dual write is enabled
  checkDualWriteFlag();

  // Hook into db state changes
  db.onStateChange(() => {
    if (!dualWriteActive) return;
    scheduleDualWrite();
  });

  // Hook into Audit Logs (Phase 2 Mirroring)
  db.onAuditLog((log) => {
    mirrorAuditLog(log).catch(() => {});
  });

  // Process retry queue every 30 seconds
  setInterval(processRetryQueue, 30000);

  console.log('[DB-ADAPTER] Dual-write adapter initialized');
}

// ─── Config Flag ──────────────────────────────────────────────────────────────
async function checkDualWriteFlag() {
  try {
    const { data } = await supabase
      .from('system_configs')
      .select('value')
      .eq('key', 'migration_control')
      .maybeSingle();

    if (data?.value) {
      applyMigrationConfig(data.value);
    }

    // Subscribe to live config changes
    const channelName = 'migration_control_watch';
    const channels = supabase.getChannels();
    if (!channels.some(c => c.topic === `realtime:${channelName}`)) {
      supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_configs',
          filter: `key=eq.migration_control`,
        }, (payload: any) => {
          if (payload.new?.value) {
            applyMigrationConfig(payload.new.value);
          }
        })
        .subscribe();
    }
  } catch (e) {
    console.warn('[DB-ADAPTER] Could not fetch migration config, defaulting to firebase_only:', e);
  }
}

function applyMigrationConfig(config: any) {
  const prevMode = migrationMode;

  // Support both old and new config formats
  if (config.migration_mode) {
    migrationMode = config.migration_mode as MigrationMode;
  } else if (config.dual_write_enabled === true) {
    migrationMode = 'dual_write';
  } else {
    migrationMode = 'firebase_only';
  }

  dualWriteActive = migrationMode === 'dual_write' || migrationMode === 'supabase_primary';
  firebaseWritesEnabled = config.firebase_writes_enabled !== false; // default true
  supabaseReadsEnabled = config.supabase_reads_enabled === true;   // default false

  if (prevMode !== migrationMode) {
    console.log(`[DB-ADAPTER] Migration mode changed: ${prevMode} → ${migrationMode}`);
    console.log(`[DB-ADAPTER]   Dual-write: ${dualWriteActive}`);
    console.log(`[DB-ADAPTER]   Firebase writes: ${firebaseWritesEnabled}`);
    console.log(`[DB-ADAPTER]   Supabase reads: ${supabaseReadsEnabled}`);
  }
}

// ─── Debounced Write Scheduler ────────────────────────────────────────────────
let writeTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleDualWrite() {
  if (writeTimer) clearTimeout(writeTimer);
  writeTimer = setTimeout(() => {
    performDualWrite().catch(console.error);
  }, SYNC_DEBOUNCE_MS);
}

// ─── Core Sync Logic ──────────────────────────────────────────────────────────
async function performDualWrite() {
  if (!dualWriteActive) return;

  const state = db.getState();
  const changes = detectChanges(state);

  if (Object.keys(changes).length === 0) return;

  console.log('[DB-ADAPTER] Syncing to Supabase:', Object.keys(changes));
  syncStats.totalWrites++;
  syncStats.lastSyncAt = new Date().toISOString();

  const syncPromises = Object.entries(changes).map(([table, rows]) =>
    upsertTable(table, rows as any[])
  );

  // Fire all syncs in parallel — never await (non-blocking)
  Promise.allSettled(syncPromises).then((results) => {
    results.forEach((result, i) => {
      const table = Object.keys(changes)[i];
      if (result.status === 'rejected') {
        syncStats.failedWrites++;
        syncStats.lastError = `${table}: ${result.reason}`;
        console.error(`[DB-ADAPTER] Sync failed for ${table}:`, result.reason);
        const rows = Object.values(changes)[i] as any[];
        addToRetryQueue(table, rows);
      }
    });
  });

  // Update snapshot of what we last synced
  lastSyncedState = {
    users: state.users,
    staff: state.staff,
    packages: state.packages,
    invoices: state.invoices,
    payments: state.payments,
    signupRequests: state.signupRequests,
    kycRequests: state.kycRequests,
    kycFiles: state.kycFiles,
    topupRequests: state.topupRequests,
    emergencyLoads: state.emergencyLoads,
    tickets: state.tickets,
  };
}

// ─── Change Detection ─────────────────────────────────────────────────────────
function detectChanges(state: AppState): Record<string, any[]> {
  const changes: Record<string, any[]> = {};

  const tableMap: Array<{ stateKey: keyof AppState; table: string }> = [
    { stateKey: 'users', table: 'users' },
    { stateKey: 'staff', table: 'staff' },
    { stateKey: 'packages', table: 'packages' },
    { stateKey: 'invoices', table: 'invoices' },
    { stateKey: 'payments', table: 'payments' },
    { stateKey: 'signupRequests', table: 'signup_requests' },
    { stateKey: 'kycRequests', table: 'kyc_requests' },
    { stateKey: 'kycFiles', table: 'kyc_files' },
    { stateKey: 'topupRequests', table: 'topup_requests' },
    { stateKey: 'emergencyLoads', table: 'emergency_loads' },
    { stateKey: 'tickets', table: 'support_tickets' },
  ];

  for (const { stateKey, table } of tableMap) {
    const current = (state as any)[stateKey];
    const previous = (lastSyncedState as any)[stateKey];
    if (!Array.isArray(current)) continue;

    if (!previous || JSON.stringify(current) !== JSON.stringify(previous)) {
      changes[table] = current;
    }
  }

  return changes;
}

// ─── Supabase Upsert ──────────────────────────────────────────────────────────
async function upsertTable(table: string, rows: any[]): Promise<void> {
  if (!rows || rows.length === 0) return;

  // Transform rows to snake_case flat columns + store raw_data
  const transformed = rows.map((row) => transformRow(table, row));

  // Batch in chunks of 100 to avoid Supabase limits
  const CHUNK_SIZE = 100;
  for (let i = 0; i < transformed.length; i += CHUNK_SIZE) {
    const chunk = transformed.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: 'id', ignoreDuplicates: false });

    if (error) {
      throw new Error(`[SUPABASE] Upsert failed for ${table}: ${error.message}`);
    }
  }
}

// ─── Row Transformer ──────────────────────────────────────────────────────────
function transformRow(table: string, row: any): any {
  if (!row || typeof row !== 'object') return row;

  // Always store the full raw object for reference
  const base: any = {
    id: row.id,
    raw_data: row,
    updated_at: new Date().toISOString(),
  };

  switch (table) {
    case 'users':
      return {
        ...base,
        connection_id: row.connectionId || row.connection_id || null,
        name: row.name || 'Unknown',
        username: row.username || null,
        email: row.email || null,
        phone: row.phone || null,
        address: row.address || null,
        area: row.area || null,
        status: row.status || 'Verification Pending',
        verification_status: row.verificationStatus || 'Unverified',
        is_kyc_verified: row.isKYCVerified || false,
        is_kyc_submitted: row.isKYCSubmitted || false,
        kyc_status: row.kyc_status || 'pending',
        approval_status: row.approval_status || 'pending',
        package_id: row.packageId || null,
        balance: row.balance || 0,
        credit_score: row.creditScore || 600,
        referral_code: row.referralCode || null,
        role: row.role || 'Customer',
        deleted: row.deleted || false,
        portal_enabled: row.portalEnabled !== false,
        management_mode: row.managementMode || 'Manual',
        connection_type: row.connectionType || 'Fiber',
        nas_connection_type: row.nasConnectionType || 'Manual',
        activation_count: row.activationCount || 0,
        cnic: row.cnic || null,
        profile_image: row.profileImage || null,
        fcm_token: row.fcmToken || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'staff':
      return {
        ...base,
        email: row.email || '',
        name: row.name || '',
        role: row.role || 'Viewer',
        status: row.status || 'Active',
        balance: row.balance || 0,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'packages':
      return {
        ...base,
        name: row.name || '',
        speed: row.speed || null,
        price: row.price || 0,
        duration: row.duration || 30,
        deleted: row.deleted || false,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'invoices':
      return {
        ...base,
        user_id: row.userId || row.user_id || '',
        user_name: row.userName || null,
        total_amount: row.totalAmount || row.total_amount || 0,
        paid_amount: row.paidAmount || 0,
        due_amount: row.dueAmount || 0,
        status: row.status || 'Unpaid',
        type: row.type || 'Monthly',
        due_date: row.dueDate || null,
        paid_at: row.paidAt || null,
        payment_method: row.paymentMethod || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'payments':
      return {
        ...base,
        user_id: row.userId || '',
        user_name: row.userName || null,
        amount: row.amount || 0,
        status: row.status || 'Pending',
        method: row.method || null,
        invoice_id: row.invoiceId || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'signup_requests':
      return {
        ...base,
        user_id: row.userId || null,
        name: row.name || '',
        username: row.username || null,
        email: row.email || null,
        phone: row.phone || null,
        status: row.status || 'Pending',
        created_at: row.timestamp || row.createdAt || new Date().toISOString(),
      };

    case 'kyc_requests':
      return {
        ...base,
        user_id: row.userId || '',
        user_name: row.userName || null,
        status: row.status || 'Pending',
        rejection_reason: row.rejectionReason || null,
        face_data: row.faceData || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'kyc_files':
      return {
        ...base,
        user_id: row.userId || '',
        user_name: row.userName || null,
        file_name: row.fileName || row.name || 'unknown',
        file_url: row.fileUrl || row.url || null,
        provider: row.provider || null,
        status: row.status || 'TEMP',
        file_type: row.fileType || row.type || null,
        size: row.size || null,
        checksum: row.checksum || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'topup_requests':
      return {
        ...base,
        user_id: row.userId || '',
        user_name: row.userName || null,
        amount: row.amount || 0,
        status: row.status || 'Pending',
        payment_method: row.paymentMethod || null,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'emergency_loads':
      return {
        ...base,
        user_id: row.userId || '',
        user_name: row.userName || null,
        amount: row.amount || 0,
        status: row.status || 'Pending_Activation',
        repaid: row.repaid || false,
        created_at: row.createdAt || new Date().toISOString(),
      };

    case 'support_tickets':
      return {
        ...base,
        user_id: row.userId || row.submittedBy || '',
        user_name: row.userName || null,
        subject: row.subject || row.title || null,
        description: row.description || null,
        status: row.status || 'Open',
        priority: row.priority || 'Medium',
        created_at: row.createdAt || new Date().toISOString(),
      };

    default:
      return base;
  }
}

// ─── Retry Queue ──────────────────────────────────────────────────────────────
function addToRetryQueue(table: string, rows: any[]) {
  retryQueue.push({ table, rows, attempt: 1 });
  if (retryQueue.length > 100) {
    retryQueue = retryQueue.slice(-100); // Cap at 100 to prevent memory leak
  }
}

async function processRetryQueue() {
  if (!dualWriteActive || retryQueue.length === 0) return;

  const toRetry = [...retryQueue];
  retryQueue = [];

  for (const item of toRetry) {
    try {
      await upsertTable(item.table, item.rows);
      console.log(`[DB-ADAPTER] Retry succeeded for ${item.table}`);
    } catch (e) {
      if (item.attempt < MAX_RETRY_ATTEMPTS) {
        retryQueue.push({ ...item, attempt: item.attempt + 1 });
      } else {
        console.error(`[DB-ADAPTER] Retry exhausted for ${item.table} after ${MAX_RETRY_ATTEMPTS} attempts`);
      }
    }

    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
}

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Audit Log Mirror ─────────────────────────────────────────────────────────
/**
 * Call this to mirror audit logs to Supabase in real-time
 * Used by db.ts logAudit() via the adapter hook
 */
export async function mirrorAuditLog(log: {
  action: string;
  userId?: string;
  userName?: string;
  details?: string;
  type?: string;
}) {
  if (!dualWriteActive) return;
  try {
    await supabase.from('audit_logs').insert({
      id: generateUUID(),
      action: log.action,
      user_id: log.userId || null,
      user_name: log.userName || null,
      details: log.details || null,
      type: log.type || null,
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    // Silent fail — never block the UI for audit log mirroring
  }
}

// ─── Status & Control Exports (Phase 3) ──────────────────────────────────────

/** Full migration health status for dashboard consumption */
export function getDualWriteStatus() {
  return {
    active: dualWriteActive,
    migrationMode,
    firebaseWritesEnabled,
    supabaseReadsEnabled,
    retryQueueDepth: retryQueue.length,
    lastSyncedKeys: Object.keys(lastSyncedState),
    syncStats: { ...syncStats },
  };
}

export function getMigrationMode(): MigrationMode {
  return migrationMode;
}

export function isSupabasePrimary(): boolean {
  return migrationMode === 'supabase_primary';
}

export function isFirebaseWriteEnabled(): boolean {
  return firebaseWritesEnabled;
}

/**
 * Read data from Supabase if reads are enabled.
 * Used by components that want to test Supabase reads before cutover.
 * Returns null if Supabase reads are not enabled (fallback to Firebase).
 */
export async function readFromSupabase<T = any>(
  table: string,
  options?: { select?: string; filter?: Record<string, any>; limit?: number }
): Promise<T[] | null> {
  if (!supabaseReadsEnabled) return null;

  try {
    let query = supabase.from(table).select(options?.select || '*');

    if (options?.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        query = query.eq(key, value);
      }
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`[DB-ADAPTER] Supabase read failed for ${table}:`, error.message);
      return null;
    }
    return data as T[];
  } catch (e) {
    console.warn(`[DB-ADAPTER] Supabase read error for ${table}:`, e);
    return null;
  }
}

/**
 * Switch migration mode programmatically from the UI.
 * This writes to Supabase system_configs and triggers Realtime propagation.
 */
export async function switchMigrationMode(
  mode: MigrationMode,
  options?: { firebaseWrites?: boolean; supabaseReads?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const newConfig = {
      migration_mode: mode,
      dual_write_enabled: mode !== 'firebase_only',
      firebase_writes_enabled: options?.firebaseWrites ?? (mode !== 'supabase_primary'),
      supabase_reads_enabled: options?.supabaseReads ?? (mode === 'supabase_primary'),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('system_configs')
      .upsert({ key: 'migration_control', value: newConfig, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return { success: false, error: error.message };

    // Optimistic local apply
    applyMigrationConfig(newConfig);

    // Log the mode switch for audit
    await supabase.from('audit_logs').insert({
      id: generateUUID(),
      action: `Migration mode switched to: ${mode}`,
      user_id: 'system',
      user_name: 'DB Adapter',
      details: JSON.stringify(newConfig),
      type: 'migration',
      created_at: new Date().toISOString(),
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export function setDualWriteActive(active: boolean) {
  dualWriteActive = active;
  console.log(`[DB-ADAPTER] Dual-write manually set to: ${active}`);
}
