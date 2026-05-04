import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enterpriseApi } from './client';
import { useBSSStore } from '../store';

// USERS
export const useGetUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Assuming a backend route exists or will be wired. Fallback to enterpriseApi.
      const res = await fetch('/api/users'); 
      return res.json();
    },
    staleTime: 30000,
  });
};

// LEDGER
export const useGetLedger = () => {
  return useQuery({
    queryKey: ['ledger'],
    queryFn: async () => {
      const res = await enterpriseApi.getLedger();
      if (!res.success) throw new Error(res.message);
      return res.data;
    },
    staleTime: 10000,
  });
};

export const useCreateLedgerEntry = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => enterpriseApi.createLedgerEntry(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      useBSSStore.getState().triggerSync();
    },
  });
};

// HARDWARE DIAGNOSTICS
export const useTestDevice = () => {
  return useMutation({
    mutationFn: ({ deviceId, protocol }: { deviceId: string; protocol: string }) => 
      enterpriseApi.testDevice(deviceId, protocol),
  });
};

// RADIUS
export const useSendRadiusCoa = () => {
  return useMutation({
    mutationFn: ({ username, action, attributes }: { username: string; action: string; attributes?: string }) => 
      enterpriseApi.sendRadiusCoa(username, action, attributes),
  });
};
