import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionId: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);
const SESSION_KEY = "adminSessionId";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(() => {
    const token = localStorage.getItem(SESSION_KEY);
    return token?.startsWith("admin_") ? token : null;
  });
  const [loggingIn, setLoggingIn] = useState(false);
  const loginAction = useAction(api.adminLogin.login);
  const logoutMutation = useMutation(api.auth.logout);
  const validation = useQuery(api.auth.validateSession, sessionId ? { sessionId } : "skip");
  const isAuthenticated = Boolean(sessionId && validation?.isValid);
  const isLoading = loggingIn || Boolean(sessionId && validation === undefined);

  useEffect(() => {
    localStorage.removeItem("simpleAdminAuth");
    localStorage.removeItem("admin_session_id");
    if (sessionId && validation && !validation.isValid) {
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    }
  }, [sessionId, validation]);

  useEffect(() => {
    if (!validation?.isValid || !validation.expiresAt) return;
    const timeout = window.setTimeout(() => {
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    }, Math.max(0, validation.expiresAt - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [validation]);

  async function login(password: string) {
    setLoggingIn(true);
    try {
      const result = await loginAction({ password });
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      return true;
    } catch {
      return false;
    } finally {
      setLoggingIn(false);
    }
  }

  async function logout() {
    const current = sessionId;
    try {
      if (current) await logoutMutation({ sessionId: current });
    } finally {
      localStorage.removeItem(SESSION_KEY);
      setSessionId(null);
    }
  }

  return <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, sessionId, login, logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  return context;
}
