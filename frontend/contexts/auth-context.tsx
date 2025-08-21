"use client";

import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { getUserData } from "@/lib/user-api";

interface User {
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, token: string) => void; // Removed role parameter since we fetch from database
  logout: () => void;
  isLoading: boolean;
  refreshUserData: () => Promise<void>; // Added function to refresh user data from database
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (email: string) => {
    try {
      const response = await getUserData(email);
      if (response.success && response.user) {
        const userData: User = {
          email: response.user.email,
          name: response.user.email.split("@")[0],
          role: response.user.role,
        };
        setUser(userData);
        localStorage.setItem(
          "educhat_user",
          JSON.stringify({
            email: userData.email,
            name: userData.name,
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUserData = async () => {
    if (user?.email) {
      await fetchUserData(user.email);
    }
  };

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem("educhat_token");
    const savedUser = localStorage.getItem("educhat_user");

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        fetchUserData(userData.email);
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem("educhat_token");
        localStorage.removeItem("educhat_user");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (email: string, authToken: string) => {
    setIsLoading(true);
    setToken(authToken);

    // Store token with expiration
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 10);

    localStorage.setItem("educhat_token", authToken);
    localStorage.setItem("educhat_token_expiry", expirationDate.toISOString());

    fetchUserData(email);
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
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, refreshUserData }}
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
