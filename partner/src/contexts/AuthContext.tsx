"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

interface AuthUser {
  sub?: string;
  name?: string;
  email?: string;
  givenName?: string;
  familyName?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(() => {
    if (status === "loading") {
      setIsLoading(true);
      return;
    }

    const authStatus = status === "authenticated" && !!session;
    setAuthenticated(authStatus);
    
    if (authStatus && session?.user) {
      setUser({
        sub: session.user.email || undefined,
        name: session.user.name || undefined,
        email: session.user.email || undefined,
      });
    } else {
      setUser(null);
    }
    
    setIsLoading(status === "loading");
  }, [status, session]);

  const refreshUser = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    setUser(null);
    setAuthenticated(false);
    await signOut({ callbackUrl: '/auth/login' });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: authenticated,
        isLoading,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

