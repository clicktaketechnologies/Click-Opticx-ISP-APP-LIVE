import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: { id: string; role: string; email: string; name: string } | null;
  isLoggedIn: boolean;
  expiresAt: number | null;
  
  login: (token: string, user: any) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      expiresAt: null,
      
      login: (token, user) => {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          set({
            token,
            user,
            isLoggedIn: true,
            expiresAt: payload.exp ? payload.exp * 1000 : Date.now() + (7 * 24 * 60 * 60 * 1000), // fallback 7d
          });
        } catch (e) {
          console.error('[AUTH STORE] Failed to parse JWT during login:', e);
          set({
            token,
            user,
            isLoggedIn: true,
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
          });
        }
      },
      
      logout: () => {
        set({ token: null, user: null, isLoggedIn: false, expiresAt: null });
        localStorage.removeItem('clickopticx_auth_token');
      },
      
      isTokenValid: () => {
        const { expiresAt } = get();
        if (!expiresAt) return false;
        return Date.now() < expiresAt;
      },
    }),
    { name: 'clickopticx-auth-v2' }
  )
);
