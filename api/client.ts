import { useAuthStore } from '../stores/authStore';

const BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:5000'
  : 'https://click-opticx-isp-app-live.onrender.com';

export async function apiCall<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { token, logout, isTokenValid } = useAuthStore.getState();
  
  if (token && !isTokenValid()) {
    logout();
    throw new Error('Session expired');
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge custom headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  
  if (res.status === 401) {
    logout();
    throw new Error('Unauthorized');
  }
  
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Request failed');
  return data;
}

// Strongly typed API layer for components to consume via React Query
export const api = {
  users: {
    list: () => apiCall<{ users: any[] }>('/api/users'),
    get: (id: string) => apiCall<{ user: any }>(`/api/users/${id}`),
    create: (data: any) => apiCall<{ user: any }>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => apiCall<{ user: any }>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => apiCall(`/api/users/${id}`, { method: 'DELETE' }),
    restore: (id: string) => apiCall(`/api/users/${id}/restore`, { method: 'POST' }),
  },
  auth: {
    login: (identifier: string, password: string) => 
      apiCall<{ token: string; user: any; userType: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }),
  },
  signup: {
    approve: (id: string) => apiCall<{ request: any }>(`/api/users/signup-requests/${id}/approve`, { method: 'POST' }),
    reject: (id: string, reason: string) => 
      apiCall<{ request: any }>(`/api/users/signup-requests/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  },
};
