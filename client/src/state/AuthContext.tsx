import { createContext, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  token: string | null;
  isAuthed: boolean;
  setToken: (value: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_COOKIE_KEY = "authToken";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  if (!value) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() =>
    readCookie(AUTH_COOKIE_KEY)
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthed: Boolean(token),
      setToken: (nextToken) => {
        writeCookie(AUTH_COOKIE_KEY, nextToken);
        setTokenState(nextToken);
      },
      logout: () => {
        writeCookie(AUTH_COOKIE_KEY, null);
        setTokenState(null);
      },
    }),
    [token]
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
