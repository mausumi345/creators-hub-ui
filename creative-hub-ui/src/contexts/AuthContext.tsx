// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiClient } from "../lib/apiClient";

// User type from /auth/me response
export interface AuthUser {
  id: string;
  email: string | null;
  roles: string[];
  locale: string | null;
  currency_code: string | null;
  timezone: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user from /auth/me (validates cookie)
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
      setUser(response.data.user);
    } catch (error) {
      // 401 means not authenticated or token expired
      setUser(null);
    }
  }, []);

  // Login with username/password
  const login = useCallback(async (username: string, password: string) => {
    const response = await apiClient.post<{
      access_token: string;
      token_type: string;
      expires_in: number;
      user: {
        id: string;
        email: string | null;
        country_code: string | null;
        locale: string | null;
        currency_code: string | null;
        timezone: string | null;
      };
    }>("/auth/login", { username, password });

    // The cookie is set automatically by the server response
    // We can use the user data from the response directly
    setUser({
      id: response.data.user.id,
      email: response.data.user.email,
      roles: [], // Login response doesn't include roles, refresh to get full user
      locale: response.data.user.locale,
      currency_code: response.data.user.currency_code,
      timezone: response.data.user.timezone,
    });
  }, []);

  // Logout - clears the cookie
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      await refreshUser();
      setIsLoading(false);
    };
    checkAuth();
  }, [refreshUser]);

  // Listen for 401 errors from apiClient
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

