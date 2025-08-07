"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, token: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem("educhat_token");
    const savedUser = localStorage.getItem("educhat_user");

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("educhat_token");
        localStorage.removeItem("educhat_user");
      }
    }

    setIsLoading(false);
  }, []);

  const login = (email: string, authToken: string) => {
    const userData: User = {
      email,
      name: email.split("@")[0], // Extract name from email
    };

    setToken(authToken);
    setUser(userData);

    // Store in localStorage with 10-day expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 10);

    localStorage.setItem("educhat_token", authToken);
    localStorage.setItem("educhat_user", JSON.stringify(userData));
    localStorage.setItem("educhat_token_expiry", expirationDate.toISOString());
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("educhat_token");
    localStorage.removeItem("educhat_user");
    localStorage.removeItem("educhat_token_expiry");
  };

  // Check token expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const expiry = localStorage.getItem("educhat_token_expiry");
      if (expiry && new Date() > new Date(expiry)) {
        logout();
      }
    };

    if (token) {
      checkTokenExpiration();
      // Check every hour
      const interval = setInterval(checkTokenExpiration, 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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
