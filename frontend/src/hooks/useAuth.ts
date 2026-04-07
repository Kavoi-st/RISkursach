import { useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUserStore, type User } from '../store/userStore';
import { googleLogin as googleLoginApi, login as loginApi, register as registerApi } from '../api/authApi';
import { setAccessToken } from '../api/apiClient';

export function normalizeUserId(raw: unknown): string {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null && 'toString' in raw) {
    return String((raw as { toString: () => string }).toString());
  }
  return String(raw);
}

export function mapRole(r?: string): User['role'] {
  if (r === 'ADMIN' || r === 'SELLER' || r === 'BUYER' || r === 'MODERATOR') return r;
  return 'BUYER';
}

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  userId?: unknown;
  email?: string;
  fullName?: string;
  role?: string;
};

export function useAuth() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const clearTokens = useAuthStore((s) => s.clearTokens);
  const setUser = useUserStore((s) => s.setUser);

  const applyAuthPayload = useCallback(
    (res: AuthPayload) => {
      setTokens(res.accessToken, res.refreshToken);
      setAccessToken(res.accessToken);
      const id = normalizeUserId(res.userId);
      if (id && res.email && res.fullName) {
        setUser({
          id,
          email: res.email,
          fullName: res.fullName,
          role: mapRole(res.role)
        });
      }
    },
    [setTokens, setUser]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginApi({ email, password });
      applyAuthPayload(res);
    },
    [applyAuthPayload]
  );

  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const res = await registerApi({ email, password, fullName });
      applyAuthPayload(res);
    },
    [applyAuthPayload]
  );

  const loginWithGoogleIdToken = useCallback(
    async (idToken: string) => {
      const res = await googleLoginApi(idToken);
      applyAuthPayload(res);
    },
    [applyAuthPayload]
  );

  const logout = useCallback(() => {
    clearTokens();
    setAccessToken(null);
    setUser(null);
  }, [clearTokens, setUser]);

  return { login, register, loginWithGoogleIdToken, logout, applyAuthPayload };
}

