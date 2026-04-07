import { create } from 'zustand';

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
};

function readInitialToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

const initialToken = readInitialToken();

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  refreshToken: null,
  isAuthenticated: !!initialToken,
  setTokens: (accessToken, refreshToken) =>
    set({
      accessToken,
      refreshToken,
      isAuthenticated: true
    }),
  clearTokens: () =>
    set({
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    })
}));

