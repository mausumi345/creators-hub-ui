// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { apiClient } from "../lib/apiClient";

// User type from /auth/me response
export interface AuthUser {
  id: string;
  email: string | null;
  roles: string[];
  session_id?: string;
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
  logoutAll: () => Promise<number>;
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
    // New API returns just { success: true, message: "...", expires_in: ... }
    // Cookies are set automatically by the server
    await apiClient.post<{
      success: boolean;
      message: string;
      expires_in: number;
    }>("/auth/login", { username, password });

    // Fetch full user data after successful login
    await refreshUser();
  }, [refreshUser]);

  // Logout - clears the cookies and revokes session
  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  }, []);

  // Logout from all devices - revokes all sessions
  const logoutAll = useCallback(async (): Promise<number> => {
    try {
      const response = await apiClient.post<{
        success: boolean;
        message: string;
        sessions_revoked: number;
      }>("/auth/logout-all");
      setUser(null);
      return response.data.sessions_revoked;
    } catch (error) {
      console.error("Logout all error:", error);
      setUser(null);
      return 0;
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

  // Listen for 401 errors from apiClient (after refresh attempt failed)
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
    logoutAll,
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
