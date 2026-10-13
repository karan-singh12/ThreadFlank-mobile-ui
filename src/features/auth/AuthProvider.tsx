import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError, setUnauthorizedHandler } from "@/lib/api/client";
import { authApi } from "./api";
import { clearSession, readSession, writeSession } from "./storage";
import type { AuthSession, AuthUser, LoginPayload, SignupPayload } from "./types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  signup: (payload: SignupPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Replaces the cached user after a profile edit or refresh. */
  setUser: (user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<AuthSession | null | undefined>(undefined);
  const status: AuthStatus = session === undefined ? "loading" : session ? "authenticated" : "unauthenticated";
  const token = session?.token ?? null;

  const logout = useCallback(async () => {
    setSession(null);
    queryClient.clear();
    await clearSession();
  }, [queryClient]);

  // Restore the saved session on launch.
  useEffect(() => {
    let live = true;
    readSession().then((saved) => live && setSession(saved));
    return () => {
      live = false;
    };
  }, []);

  // Any authenticated request answered with 401 ends the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  // Confirm a restored token with the server and refresh the cached user.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    authApi
      .profile(token, controller.signal)
      .then((user) => {
        setSession((s) => (s && s.token === token ? { token, user } : s));
        void writeSession({ token, user });
      })
      .catch((error) => {
        // Only a definitive rejection ends the session; network hiccups keep it.
        if (error instanceof ApiError && error.status === 401) void logout();
      });
    return () => controller.abort();
  }, [token, logout]);

  const start = useCallback(async (next: AuthSession) => {
    await writeSession(next);
    setSession(next);
    return next.user;
  }, []);

  const login = useCallback(async (payload: LoginPayload) => start(await authApi.login(payload)), [start]);
  const signup = useCallback(async (payload: SignupPayload) => start(await authApi.signup(payload)), [start]);

  const setUser = useCallback(async (user: AuthUser) => {
    setSession((s) => (s ? { ...s, user } : s));
    const current = await readSession();
    if (current) await writeSession({ token: current.token, user });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user: session?.user ?? null, token, login, signup, logout, setUser }),
    [status, session, token, login, signup, logout, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** The signed-in token; screens under the (app) group are only rendered when there is one. */
export function useToken() {
  const { token } = useAuth();
  if (!token) throw new Error("useToken called while signed out");
  return token;
}
