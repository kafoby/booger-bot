import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface AuthUser {
  id: number;
  discordId: string;
  username: string;
  discriminator: string | null;
  avatar: string | null;
  email: string | null;
  hasRequiredRole: boolean;
}

interface AuthStatus {
  configured: boolean;
  authenticated: boolean;
  user: AuthUser | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isConfigured: boolean;
  error: string | null;
  login: () => void;
  logout: () => Promise<void>;
  refetch: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuthStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/auth/status", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch auth status");
      }

      const data: AuthStatus = await response.json();
      setIsConfigured(data.configured);
      setUser(data.user);
    } catch (err) {
      console.error("Auth status fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  const login = () => {
    window.location.href = "/api/auth/discord";
  };

  const logout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error:", err);
      setError(err instanceof Error ? err.message : "Logout failed");
    }
  };

  const refetch = async () => {
    await fetchAuthStatus();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isConfigured,
        error,
        login,
        logout,
        refetch,
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

// Helper to get Discord avatar URL
export function getDiscordAvatarUrl(user: AuthUser): string {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`;
  }
  // Default Discord avatar based on discriminator
  const defaultAvatarIndex = parseInt(user.discriminator || "0") % 5;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png`;
}
