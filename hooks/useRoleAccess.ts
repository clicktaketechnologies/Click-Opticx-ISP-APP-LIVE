import { useMemo } from 'react';
import { AppState, Role } from '../types';

export const useRoleAccess = (state: AppState) => {
    const roleRaw = state.auth?.role as string;
    const role = (roleRaw || '').toLowerCase();
    const permissions = (state.auth as any)?.permissions || [];

    const canAccess = (module: string) => {
        const m = module.toLowerCase();
        if (role === 'superadmin' || role === 'owner') return true;
        
        // Define module mapping
        const moduleMap: Record<string, string[]> = {
            'finance': ['financeadmin', 'accountsmanager', 'billingagent'],
            'network': ['networkadmin', 'nocengineer', 'technicallead'],
            'support': ['supporthead', 'supportagent', 'ticketingadmin'],
            'kyc': ['kycmanager', 'verificationofficer'],
            'admin': ['superadmin', 'owner', 'operationslead', 'admin']
        };

        const allowedRoles = moduleMap[m] || [];
        return allowedRoles.includes(role) || permissions.includes(m);
    };

    const isInternal = useMemo(() => {
        return ['superadmin', 'owner', 'operationslead', 'financeadmin', 'networkadmin', 'admin'].includes(role);
    }, [role]);

    return { role, canAccess, isInternal };
};
