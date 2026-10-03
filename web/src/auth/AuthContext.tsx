import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../api/types';
import { api } from '../api/endpoints';
import { tokenStorage } from './tokenStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    department_id?: string | null;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser<User>());
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    try {
      // Calls /api/auth/me with HTTP-only cookie
      const me = await api.getMe();
      setUser(me);
      tokenStorage.setUser(me);
      setToken('cookie_session');
    } catch {
      tokenStorage.clearToken();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Backend automatically sets secure HTTP-only auth_token cookie
      const response = await api.login({ email, password });

      if (response.access_token) {
        tokenStorage.setToken(response.access_token);
      }
      tokenStorage.setUser(response.user);
      setToken(response.access_token || 'cookie_session');
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    department_id?: string | null;
  }) => {
    setIsLoading(true);
    try {
      const response = await api.register(data);
      if (response.access_token) {
        tokenStorage.setToken(response.access_token);
      }
      tokenStorage.setUser(response.user);
      setToken(response.access_token || 'cookie_session');
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Cookie cleared
    } finally {
      tokenStorage.clearToken();
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
