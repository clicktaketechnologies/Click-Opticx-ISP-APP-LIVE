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
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_view ?? false;
  };

  const canEdit = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_edit ?? false;
  };

  const canDelete = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_delete ?? false;
  };

  const canExport = (pageId: string) => {
    if (isSuperAdmin) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_export ?? false;
  };

  return { canView, canEdit, canDelete, canExport, role, isSuperAdmin };
};
