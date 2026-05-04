import { create } from 'zustand';
import { AppState, ISPUser, Invoice } from '../types';

interface BSSStore {
  // Global State
  users: ISPUser[];
  invoices: Invoice[];
  systemStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  
  // Actions
  setUsers: (users: ISPUser[]) => void;
  setInvoices: (invoices: Invoice[]) => void;
  updateUserStatus: (id: string, status: string) => void;
  
  // Cache invalidation triggers (simple event bus for cross-component sync)
  lastUpdate: number;
  triggerSync: () => void;
}

export const useBSSStore = create<BSSStore>((set) => ({
  users: [],
  invoices: [],
  systemStatus: 'ONLINE',

  setUsers: (users) => set({ users }),
  setInvoices: (invoices) => set({ invoices }),
  updateUserStatus: (id, status) => 
    set((state) => ({
      users: state.users.map(u => u.id === id ? { ...u, status } : u),
      lastUpdate: Date.now()
    })),
    
  lastUpdate: Date.now(),
  triggerSync: () => set({ lastUpdate: Date.now() })
}));
