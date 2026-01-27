
import { AppState, ISPUser } from '../types';

export const RequestGuard = {
  hasPendingRequest: (state: AppState, userId: string, type: 'topup' | 'package' | 'collection') => {
    if (type === 'topup') {
      return (state.topupRequests || []).some(r => r.userId === userId && r.status === 'Pending');
    }
    if (type === 'package') {
      return (state.packageRequests || []).some(r => r.userId === userId && r.status === 'Pending');
    }
    // Add logic for collection if tracked separately, or reuse topup logic
    return false;
  },

  canPerformAction: (state: AppState, userId: string, action: string) => {
    const user = state.users.find(u => u.id === userId);
    if (!user) return { allowed: false, message: 'Identity not found.' };
    
    if (action === 'emergency_load') {
      const hasActiveEL = (state.emergencyLoads || []).some(l => l.userId === userId && !l.repaid);
      if (hasActiveEL) return { allowed: false, message: 'System Lock: Clear existing emergency credit first.' };
    }

    return { allowed: true };
  }
};
