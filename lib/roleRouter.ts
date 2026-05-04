/**
 * roleRouter.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Enterprise Role → Layout → Route mapper.
 *
 * STRICT RULES:
 * - NO cross-role imports. Each role group maps to its own layout and module set.
 * - State access is read-only via selectors. NO mutations here.
 * - All page imports are lazy-loaded to prevent bundle bloat.
 */

import { lazy } from 'react';
import { Role } from '../types';

// ─── Lazy Module Loader (with retry on chunk failure) ───────────────────────
const lazyWithRetry = (fn: () => Promise<any>) =>
  lazy(() =>
    fn().catch(() => {
      window.location.reload();
      return { default: () => null };
    })
  );

// ─── Layout Definitions (isolated per role domain) ──────────────────────────
export type LayoutType = 'admin' | 'finance' | 'network' | 'support' | 'subscriber' | 'legacy';

// ─── Route Definition ────────────────────────────────────────────────────────
export interface RoleRoute {
  path: string;
  component: ReturnType<typeof lazyWithRetry>;
  requiredRoles: Role[];
  layout: LayoutType;
  label: string;
}

// ─── ADMIN MODULE ROUTES ─────────────────────────────────────────────────────
const adminRoutes: RoleRoute[] = [
  {
    path: '/dashboard',
    component: lazyWithRetry(() => import('../pages/v2/DashboardV2')),
    requiredRoles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.ADMIN, Role.MANAGER],
    layout: 'admin',
    label: 'Dashboard',
  },
  {
    path: '/users',
    component: lazyWithRetry(() => import('../pages/v2/UserManagementV2')),
    requiredRoles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.ADMIN, Role.MANAGER, Role.FIELD_AGENT],
    layout: 'admin',
    label: 'Subscribers',
  },
  {
    path: '/staff',
    component: lazyWithRetry(() => import('../pages/AccessControlPage')),
    requiredRoles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.ADMIN],
    layout: 'admin',
    label: 'Staff & Access Control',
  },
  {
    path: '/kyc-hub',
    component: lazyWithRetry(() => import('../pages/KYCManagement')),
    requiredRoles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN],
    layout: 'admin',
    label: 'KYC Management',
  },
  {
    path: '/approval-desk',
    component: lazyWithRetry(() => import('../pages/MasterApprovalDashboard')),
    requiredRoles: [Role.SUPER_ADMIN, Role.BUSINESS_ADMIN, Role.ADMIN, Role.MANAGER],
    layout: 'admin',
    label: 'Approval Desk',
  },
];

// ─── FINANCE MODULE ROUTES ────────────────────────────────────────────────────
const financeRoutes: RoleRoute[] = [
  {
    path: '/finance',
    component: lazyWithRetry(() => import('../pages/v2/FiscalHubV2')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT, Role.MANAGER],
    layout: 'finance',
    label: 'Fiscal Hub',
  },
  {
    path: '/accounting',
    component: lazyWithRetry(() => import('../pages/AccountingLedger')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT],
    layout: 'finance',
    label: 'Accounting Ledger',
  },
  {
    path: '/invoice-management',
    component: lazyWithRetry(() => import('../pages/InvoiceManagementAdmin')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT, Role.CASHIER],
    layout: 'finance',
    label: 'Invoice Management',
  },
  {
    path: '/invoice-engine',
    component: lazyWithRetry(() => import('../pages/InvoiceGenerator')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.ACCOUNTANT],
    layout: 'finance',
    label: 'Invoice Generator',
  },
  {
    path: '/wallet',
    component: lazyWithRetry(() => import('../pages/WalletManagement')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.CASHIER],
    layout: 'finance',
    label: 'Wallet Management',
  },
  {
    path: '/gateway-settings',
    component: lazyWithRetry(() => import('../pages/PaymentMethodsIndex')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN],
    layout: 'finance',
    label: 'Payment Gateways',
  },
  {
    path: '/recovery',
    component: lazyWithRetry(() => import('../pages/Recovery')),
    requiredRoles: [Role.SUPER_ADMIN, Role.FINANCE_ADMIN, Role.RECOVERY_MANAGER, Role.CASHIER],
    layout: 'finance',
    label: 'Recovery Engine',
  },
];

// ─── NETWORK MODULE ROUTES ────────────────────────────────────────────────────
const networkRoutes: RoleRoute[] = [
  {
    path: '/network',
    component: lazyWithRetry(() => import('../pages/v2/NetworkPlaneV2')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.ADMIN],
    layout: 'network',
    label: 'Network Plane',
  },
  {
    path: '/nas-management',
    component: lazyWithRetry(() => import('../pages/NASManagement')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN],
    layout: 'network',
    label: 'NAS Management',
  },
  {
    path: '/olt-management',
    component: lazyWithRetry(() => import('../pages/OLTManagement')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN],
    layout: 'network',
    label: 'OLT Management',
  },
  {
    path: '/noc-dashboard',
    component: lazyWithRetry(() => import('../pages/NOCDashboard')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.ADMIN],
    layout: 'network',
    label: 'NOC Dashboard',
  },
  {
    path: '/hotspot-tokens',
    component: lazyWithRetry(() => import('../pages/HotspotManager')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.ADMIN],
    layout: 'network',
    label: 'Hotspot Manager',
  },
  {
    path: '/connection-setup',
    component: lazyWithRetry(() => import('../pages/ConnectionSetupAdmin')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.FIELD_AGENT],
    layout: 'network',
    label: 'Connection Setup',
  },
  {
    path: '/speed-test',
    component: lazyWithRetry(() => import('../pages/SpeedTestPage')),
    requiredRoles: [Role.SUPER_ADMIN, Role.NETWORK_ADMIN, Role.ADMIN, Role.SUPPORT_ADMIN],
    layout: 'network',
    label: 'Speed Test',
  },
];

// ─── SUPPORT MODULE ROUTES ────────────────────────────────────────────────────
const supportRoutes: RoleRoute[] = [
  {
    path: '/tickets',
    component: lazyWithRetry(() => import('../pages/TicketManagementAdmin')),
    requiredRoles: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.SUPPORT_EXECUTIVE, Role.ADMIN],
    layout: 'support',
    label: 'Support Tickets',
  },
  {
    path: '/comm-center',
    component: lazyWithRetry(() => import('../pages/v2/CommCenterV2')),
    requiredRoles: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.ADMIN],
    layout: 'support',
    label: 'Comm Center',
  },
  {
    path: '/admin-reminders',
    component: lazyWithRetry(() => import('../pages/AdminReminders')),
    requiredRoles: [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.ADMIN, Role.CASHIER],
    layout: 'support',
    label: 'Admin Reminders',
  },
];

// ─── SUBSCRIBER MODULE ROUTES ─────────────────────────────────────────────────
// Subscriber routes are handled by SubscriberApp.tsx directly (isolated SPA).
// These routes are declared only for type-safety and documentation purposes.
export const subscriberRoutes: RoleRoute[] = [
  {
    path: '/portal',
    component: lazyWithRetry(() => import('../SubscriberApp')),
    requiredRoles: [Role.CUSTOMER],
    layout: 'subscriber',
    label: 'Subscriber Portal',
  },
];

// ─── MASTER ROUTE REGISTRY ────────────────────────────────────────────────────
export const ALL_ROLE_ROUTES: RoleRoute[] = [
  ...adminRoutes,
  ...financeRoutes,
  ...networkRoutes,
  ...supportRoutes,
];

// ─── ROLE → LAYOUT MAPPING ────────────────────────────────────────────────────
export const ROLE_LAYOUT_MAP: Record<string, LayoutType> = {
  [Role.SUPER_ADMIN]:      'admin',
  [Role.BUSINESS_ADMIN]:   'admin',
  [Role.ADMIN]:            'admin',
  [Role.MANAGER]:          'admin',
  [Role.FINANCE_ADMIN]:    'finance',
  [Role.ACCOUNTANT]:       'finance',
  [Role.CASHIER]:          'finance',
  [Role.RECOVERY_MANAGER]: 'finance',
  [Role.NETWORK_ADMIN]:    'network',
  [Role.FIELD_AGENT]:      'network',
  [Role.SUPPORT_ADMIN]:    'support',
  [Role.SUPPORT_EXECUTIVE]:'support',
  [Role.TEAM_MEMBER]:      'support',
  [Role.VIEWER]:           'admin',
  [Role.FRANCHISE]:        'admin',
  [Role.DEALER]:           'admin',
  [Role.SUB_DEALER]:       'admin',
  [Role.CUSTOMER]:         'subscriber',
};

// ─── SELECTORS (read-only, no mutations) ─────────────────────────────────────

/** Returns the layout type for a given role. Defaults to 'admin' for unknown roles. */
export function getLayoutForRole(role: string): LayoutType {
  const cleanRole = role.toLowerCase().replace(/\s/g, '');
  const entry = Object.entries(ROLE_LAYOUT_MAP).find(([r]) => r.toLowerCase().replace(/\s/g, '') === cleanRole);
  return entry ? entry[1] : 'admin';
}

/** Returns all routes the given role is permitted to access. */
export function getRoutesForRole(role: string): RoleRoute[] {
  const cleanRole = role.toLowerCase().replace(/\s/g, '');
  return ALL_ROLE_ROUTES.filter(r => 
    r.requiredRoles.some(rr => rr.toLowerCase().replace(/\s/g, '') === cleanRole)
  );
}

/** Returns the default landing path for a given role. */
export function getDefaultPathForRole(role: string): string {
  const layout = getLayoutForRole(role);
  switch (layout) {
    case 'finance':  return '/finance';
    case 'network':  return '/network';
    case 'support':  return '/tickets';
    case 'subscriber': return '/portal';
    default:         return '/dashboard';
  }
}

/** 
 * Checks if a specific route path is accessible by the given role.
 * Used for guarded navigation — returns false if the role is not permitted.
 */
export function canRoleAccessPath(role: string, path: string): boolean {
  // Normalize path (remove trailing slash, except for root)
  const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
  
  const route = ALL_ROLE_ROUTES.find(r => r.path === normalizedPath);
  if (!route) return false;

  // Normalize  // Robust check for SuperAdmin or Admin (Case-insensitive, Handles spaces)
  const isSuperAdmin = ['superadmin', 'admin'].includes(role.toLowerCase().replace(/\s/g, ''));
  if (isSuperAdmin) return true;
  
  const cleanRole = role.toLowerCase().replace(/\s/g, '');
  return route.requiredRoles.some(requiredRole => {
    const cleanRequired = requiredRole.toLowerCase().replace(/\s/g, '');
    return cleanRequired === cleanRole;
  });
}
