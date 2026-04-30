import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { BASE_URL } from '../lib/api';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore user from stored token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('access_token');
    if (!storedToken) { setIsLoading(false); return; }

    // Decode payload (no verify — just for display)
    try {
      const payload = JSON.parse(atob(storedToken.split('.')[1]));
      if (payload.exp * 1000 > Date.now()) {
        setUser({ id: payload.id, email: payload.email, role: payload.role });
        setToken(storedToken);
      } else {
        _refreshToken();
      }
    } catch {
      _clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for auto-logout triggered by 401 in apiFetch
  useEffect(() => {
    const handler = () => _clearAuth();
    window.addEventListener('auth:logout', handler);
    return () => window.removeEventListener('auth:logout', handler);
  }, []);

  async function _refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) { _clearAuth(); return; }
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (res.ok) {
        const { accessToken } = await res.json();
        localStorage.setItem('access_token', accessToken);
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setToken(accessToken);
        setUser({ id: payload.id, email: payload.email, role: payload.role });
      } else {
        _clearAuth();
      }
    } catch {
      _clearAuth();
    }
  }

  function _clearAuth() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Đăng nhập thất bại');
    }
    const data = await res.json();
    localStorage.setItem('access_token', data.accessToken);
    localStorage.setItem('refresh_token', data.refreshToken);
    setToken(data.accessToken);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
    } catch { /* ignore */ }
    _clearAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
