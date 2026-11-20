import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    authService.me().then((u) => {
      setUser(u);
      setReady(true);
    });
  }, []);

  const value: AuthState = {
    user,
    ready,
    async login(email, password) {
      const u = await authService.login(email, password);
      setUser(u);
      return u;
    },
    logout() {
      authService.logout();
      setUser(null);
    },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
