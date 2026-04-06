import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  cognitoConfirmNewPasswordAdmin,
  cognitoSignInAdmin,
  cognitoSignOut,
  loadPersistedAdminSession,
  type CognitoSignInAdminResult,
} from "../lib/cognito-auth";
import { isCognitoConfigured } from "../lib/cognito-config";

type AuthContextValue = {
  /** Cognito admin session (ID token present + admin claims). */
  isAuthed: boolean;
  /** Initial session probe finished (avoid redirect flash). */
  authReady: boolean;
  loginWithEmailPassword: (email: string, password: string) => Promise<CognitoSignInAdminResult>;
  confirmNewPassword: (newPassword: string, userAttributes?: Record<string, string>) => Promise<void>;
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
    const result = await cognitoSignInAdmin(email, password);
    if (result.status === "signed_in") {
      setIsAuthed(true);
    }
    return result;
  }, []);

  const confirmNewPassword = useCallback(async (newPassword: string, userAttributes?: Record<string, string>) => {
    await cognitoConfirmNewPasswordAdmin(newPassword, userAttributes);
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
      confirmNewPassword,
      logout,
    }),
    [isAuthed, authReady, loginWithEmailPassword, confirmNewPassword, logout]
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
