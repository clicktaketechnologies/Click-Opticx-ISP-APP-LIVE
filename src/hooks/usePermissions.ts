import { useMemo } from 'react';
import { AppState, Role, RolePermission } from '../../types';

/**
 * usePermissions - Dynamic RBAC hook driven by database matrix
 * Removes all hardcoded role logic from UI components.
 */
export const usePermissions = (state: AppState) => {
  const rawRole = state.auth?.role || state.currentUser?.role || 'Viewer';
  const role = String(rawRole);
  const permissions = state.permissions || [];

  // Robust check for SuperAdmin or Admin (Case-insensitive, Handles spaces)
  const isSuperAdmin = ['superadmin', 'admin'].includes(role.toLowerCase().replace(/\s/g, ''));

  if (isSuperAdmin) {
    console.log(`[PERMISSIONS] Administrative role "${role}" detected — Granting total access.`);
  }

  const canView = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.id === pageId);
    return perm?.view?.includes(role) ?? false;
  };

  const canEdit = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.id === pageId);
    return perm?.edit?.includes(role) ?? false;
  };

  const canDelete = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.id === pageId);
    return perm?.delete?.includes(role) ?? false;
  };

  const canExport = (pageId: string) => {
    if (isSuperAdmin) return true;
    // Export might not be in the matrix yet, default to false for non-admins
    return false; 
  };

  return { canView, canEdit, canDelete, canExport, role, isSuperAdmin };
};
