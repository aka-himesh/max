import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role } from '../api/types';
import { api } from '../api/endpoints';
import { tokenStorage } from './tokenStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => tokenStorage.getUser<User>());
  const [token, setToken] = useState<string | null>(() => tokenStorage.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuth = useCallback(async () => {
    const existingToken = tokenStorage.getToken();
    if (!existingToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await api.getMe();
      if (me.role !== 'officer' && me.role !== 'admin') {
        tokenStorage.clearToken();
        setUser(null);
        setToken(null);
        throw new Error('Access denied: Citizens and contractors cannot access the Authority Dashboard.');
      }
      setUser(me);
      tokenStorage.setUser(me);
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
      const response = await api.login({ email, password });
      const role: Role = response.user.role;

      if (role !== 'officer' && role !== 'admin') {
        tokenStorage.clearToken();
        throw new Error('Access denied: Citizens and contractors cannot access the Authority Dashboard.');
      }

      tokenStorage.setToken(response.access_token);
      tokenStorage.setUser(response.user);
      setToken(response.access_token);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Stateless token fallback
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
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
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
