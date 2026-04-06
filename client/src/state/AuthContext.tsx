import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { cognitoSignInAdmin, cognitoSignOut, loadPersistedAdminSession } from "../lib/cognito-auth";
import { isCognitoConfigured } from "../lib/cognito-config";

type AuthContextValue = {
  /** Cognito admin session (ID token present + admin claims). */
  isAuthed: boolean;
  /** Initial session probe finished (avoid redirect flash). */
  authReady: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setIsAuthed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        if (!isCognitoConfigured()) {
          setIsAuthed(false);
          return;
        }
        const ok = await loadPersistedAdminSession();
        setIsAuthed(ok);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  const loginWithEmailPassword = useCallback(async (email: string, password: string) => {
    await cognitoSignInAdmin(email, password);
    setIsAuthed(true);
  }, []);

  const logout = useCallback(async () => {
    await cognitoSignOut();
    setIsAuthed(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthed,
      authReady,
      loginWithEmailPassword,
      logout,
    }),
    [isAuthed, authReady, loginWithEmailPassword, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
