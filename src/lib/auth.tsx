"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, SESSION_ENDED } from "@/lib/api";
import { setTokens } from "@/lib/session";
import type { Role, TokenPair, User } from "@/lib/types";

export interface RegisterInput {
  full_name: string;
  email: string;
  phone_number: string;
  password: string;
  role: "patient" | "professional";
}

interface AuthContextValue {
  user: User | null;
  /** True until the first "who am I" check has finished. */
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homeFor(role: Role): string {
  return role === "professional" ? "/pro" : "/patient";
}

/** App build: keep the tokens on the phone. The web build's session is already in cookies. */
function keepSession(tokens: TokenPair): Promise<void> {
  return setTokens({ access: tokens.access_token, refresh: tokens.refresh_token });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<User>("/auth/me")
      .then((me) => active && setUser(me))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // A dead session signs the user out
  useEffect(() => {
    const signOut = () => setUser(null);
    window.addEventListener(SESSION_ENDED, signOut);
    return () => window.removeEventListener(SESSION_ENDED, signOut);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await api<TokenPair>("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    await keepSession(tokens);
    setUser(tokens.user);
    return tokens.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const tokens = await api<TokenPair>("/auth/register", { method: "POST", body: input });
    await keepSession(tokens);
    setUser(tokens.user);
    return tokens.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      await setTokens(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
