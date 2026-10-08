import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, getStoredUser, clearAuth, logout as logoutService, type AuthUser } from "../../services/authService";
import { clearPostLoginIntent } from "../../services/guestTrial";

type AuthContextValue = {
  user: AuthUser | null;
  isBootstrapping: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedUser = getStoredUser();
    
    // If no stored user hint, we assume not logged in to avoid unnecessary 401s
    if (!storedUser) {
      setIsBootstrapping(false);
      return;
    }

    // Attempt to verify/refresh session
    getCurrentUser()
      .then((nextUser) => {
        setUser(nextUser);
      })
      .catch(() => {
        clearAuth();
        setUser(null);
      })
      .finally(() => {
        setIsBootstrapping(false);
      });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBootstrapping,
      setUser,
      logout: async () => {
        clearPostLoginIntent();
        await logoutService();
        setUser(null);
      },
    }),
    [isBootstrapping, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

