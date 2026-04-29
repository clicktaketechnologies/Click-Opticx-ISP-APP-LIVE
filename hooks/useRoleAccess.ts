import { useMemo } from 'react';
import { AppState, Role } from '../types';

export const useRoleAccess = (state: AppState) => {
    const role = state.user?.role as Role;
    const permissions = state.user?.permissions || [];

    const canAccess = (module: string) => {
        if (role === 'SuperAdmin' || role === 'Owner') return true;
        
        // Define module mapping
        const moduleMap: Record<string, string[]> = {
            'finance': ['FinanceAdmin', 'AccountsManager', 'BillingAgent'],
            'network': ['NetworkAdmin', 'NOCEngineer', 'TechnicalLead'],
            'support': ['SupportHead', 'SupportAgent', 'TicketingAdmin'],
            'kyc': ['KYCManager', 'VerificationOfficer'],
            'admin': ['SuperAdmin', 'Owner', 'OperationsLead']
        };

        const allowedRoles = moduleMap[module] || [];
        return allowedRoles.includes(role) || permissions.includes(module);
    };

    const isInternal = useMemo(() => {
        return ['SuperAdmin', 'Owner', 'OperationsLead', 'FinanceAdmin', 'NetworkAdmin'].includes(role);
    }, [role]);

    return { role, canAccess, isInternal };
};
