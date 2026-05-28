import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueryClient } from '@tanstack/react-query';

/**
 * Enterprise React Query Client
 * Configured for real-time telemetry and cache invalidation
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

/**
 * Enterprise UI State Store (Zustand)
 * ONLY holds ephemeral UI state, preferences, and auth tokens.
 * ALL business data must flow through React Query and backend endpoints.
 */
interface AppState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  activeTenantId: string | null;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setActiveTenant: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      activeTenantId: null,
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setActiveTenant: (id) => set({ activeTenantId: id }),
    }),
    {
      name: 'clickopticx-ui-state',
      partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }), // Persist only specific fields
    }
  )
);

// Helper to invalidate queries on socket events
export const invalidateQueriesOnEvent = (eventType: string) => {
  switch(eventType) {
    case 'BILLING_UPDATED':
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      break;
    case 'NETWORK_STATE_CHANGED':
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['onts'] });
      break;
    case 'USER_PROFILE_CHANGED':
      queryClient.invalidateQueries({ queryKey: ['users'] });
      break;
  }
};
