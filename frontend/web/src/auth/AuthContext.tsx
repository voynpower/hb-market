/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '../lib/api';
import type { Address, UserSummary } from '../types';

type AuthState = {
  token: string | null;
  user: (UserSummary & { addresses?: Address[] }) | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login: (payload: { email: string; password: string }) => Promise<void>;
  adminLogin: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (payload: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    addresses?: Array<{
      recipient_name: string;
      recipient_phone: string;
      zip_code: string;
      address1: string;
      address2?: string;
      is_default?: boolean;
    }>;
  }) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AUTH_STORAGE_KEY = 'hb-market-auth';

const AuthContext = createContext<AuthState | null>(null);

function readStoredAuth() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return { token: null as string | null, user: null as AuthState['user'] };
  }

  try {
    const parsed = JSON.parse(raw) as { token?: string; user?: AuthState['user'] };
    return {
      token: parsed.token ?? null,
      user: parsed.user ?? null,
    };
  } catch {
    return { token: null as string | null, user: null as AuthState['user'] };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ token, user }, setAuth] = useState(readStoredAuth);
  const [hasValidatedStoredToken, setHasValidatedStoredToken] = useState(
    () => !token,
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    void api
      .me(token)
      .then((profile) => {
        setAuth({ token, user: profile });
      })
      .catch(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth({ token: null, user: null });
      })
      .finally(() => {
        setHasValidatedStoredToken(true);
      });
  }, [token]);

  const value = useMemo<AuthState>(
    () => ({
      token,
      user,
      isReady: hasValidatedStoredToken,
      isAuthenticated: Boolean(token && user),
      async login(payload) {
        const response = await api.signIn(payload);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: response.access_token, user: response.user }),
        );
        setAuth({ token: response.access_token, user: response.user });
      },
      async adminLogin(payload) {
        const response = await api.adminSignIn(payload);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: response.access_token, user: response.user }),
        );
        setAuth({ token: response.access_token, user: response.user });
      },
      async signUp(payload) {
        const response = await api.signUp(payload);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token: response.access_token, user: response.user }),
        );
        setAuth({ token: response.access_token, user: response.user });
      },
      logout() {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setAuth({ token: null, user: null });
      },
      async refreshProfile() {
        if (!token) {
          throw new ApiError('Not authenticated', 401, null);
        }
        const profile = await api.me(token);
        localStorage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ token, user: profile }),
        );
        setAuth({ token, user: profile });
      },
    }),
    [hasValidatedStoredToken, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
