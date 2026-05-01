import { useMemo } from 'react';
import { AppState, Role, RolePermission } from '../../types';

/**
 * usePermissions - Dynamic RBAC hook driven by database matrix
 * Removes all hardcoded role logic from UI components.
 */
export const usePermissions = (state: AppState) => {
  const role = state.auth?.role as Role;
  const permissions = state.permissions || [];

  const canView = (pageId: string) => {
    // SuperAdmin always has full access
    if (role === Role.SUPER_ADMIN) return true;
    
    // Find permission record for this page
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_view ?? false;
  };

  const canEdit = (pageId: string) => {
    if (role === Role.SUPER_ADMIN) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_edit ?? false;
  };

  const canDelete = (pageId: string) => {
    if (role === Role.SUPER_ADMIN) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_delete ?? false;
  };

  const canExport = (pageId: string) => {
    if (role === Role.SUPER_ADMIN) return true;
    const perm = permissions.find(p => p.page_id === pageId);
    return perm?.can_export ?? false;
  };

  return { canView, canEdit, canDelete, canExport, role };
};
