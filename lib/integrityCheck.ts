/**
 * integrityCheck.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Runtime integrity guard for the role-based routing system.
 * If VITE_ENABLE_ROLE_ROUTING is true but the new layout crashes, this module
 * detects the failure and auto-rolls back to the legacy switch/case routing.
 *
 * Usage: Call checkIntegrity() before mounting the new RoleRouter.
 * If it returns false, render LegacyRoutes as a fallback.
 */

const INTEGRITY_FLAG_KEY = 'co_role_router_integrity';
const MAX_CRASH_COUNT = 2;

export interface IntegrityStatus {
  isHealthy: boolean;
  rollbackReason?: string;
  crashCount: number;
}

/**
 * Called by the new RoleRouter on mount. Reads the crash counter from
 * sessionStorage. If it exceeds MAX_CRASH_COUNT, returns unhealthy.
 */
export function checkIntegrity(): IntegrityStatus {
  try {
    const raw = sessionStorage.getItem(INTEGRITY_FLAG_KEY);
    const crashCount = raw ? parseInt(raw, 10) : 0;

    if (crashCount >= MAX_CRASH_COUNT) {
      return {
        isHealthy: false,
        rollbackReason: `Role router crashed ${crashCount}x. Auto-rolled back to legacy routing.`,
        crashCount,
      };
    }

    return { isHealthy: true, crashCount };
  } catch {
    // sessionStorage not available (e.g., private browser); assume healthy.
    return { isHealthy: true, crashCount: 0 };
  }
}

/**
 * Called from the ErrorBoundary wrapping the RoleRouter.
 * Increments the crash counter in sessionStorage.
 */
export function recordCrash(error: Error): void {
  try {
    const raw = sessionStorage.getItem(INTEGRITY_FLAG_KEY);
    const crashCount = raw ? parseInt(raw, 10) : 0;
    sessionStorage.setItem(INTEGRITY_FLAG_KEY, String(crashCount + 1));
    console.error('[INTEGRITY] Role router crash recorded:', error.message);
  } catch {
    // Silently fail — do not break the error boundary chain.
  }
}

/**
 * Called after a successful mount of the new RoleRouter.
 * Resets the crash counter so transient errors don't permanently lock out the new system.
 */
export function clearCrashRecord(): void {
  try {
    sessionStorage.removeItem(INTEGRITY_FLAG_KEY);
  } catch {
    // pass
  }
}

/**
 * Feature flag check.
 * Returns true only if VITE_ENABLE_ROLE_ROUTING=true AND the system is not in rollback state.
 */
export function isRoleRoutingEnabled(): boolean {
  const featureFlag = import.meta.env.VITE_ENABLE_ROLE_ROUTING === 'true';
  if (!featureFlag) return false;
  return checkIntegrity().isHealthy;
}
