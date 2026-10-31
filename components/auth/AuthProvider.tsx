"use client";

import type { Session } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export type AuthState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "not_admin"; email: string | null; reason: string }
  | { status: "error"; message: string }
  | { status: "admin"; session: Session; email: string | null; userId: string };

type AuthContextValue = {
  state: AuthState;
  signOut: () => Promise<void>;
  recheck: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = { admin: boolean; user: { id: string; email: string | null } };

async function verifyAdmin(session: Session | null): Promise<AuthState> {
  if (!session) return { status: "signed_out" };
  try {
    const me = await api<MeResponse>("/me");
    return { status: "admin", session, email: me.user.email, userId: me.user.id };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) return { status: "signed_out" };
      if (err.status === 403 || err.code === "ADMIN_NOT_CONFIGURED") {
        return {
          status: "not_admin",
          email: session.user.email ?? null,
          reason:
            err.code === "ADMIN_NOT_CONFIGURED"
              ? "Admin access is not configured on the server. Add your user ID to ADMIN_USER_IDS in the backend .env."
              : "This account is not on the admin allowlist.",
        };
      }
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "Could not verify admin access." };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let lastUserId: string | null | undefined;

    const apply = async (session: Session | null) => {
      const userId = session?.user.id ?? null;
      if (userId === lastUserId) return;
      lastUserId = userId;
      const next = await verifyAdmin(session);
      if (!cancelled) setState(next);
    };

    supabase.auth.getSession().then(({ data }) => apply(data.session));

    // supabase-js deadlocks if auth methods run inside this callback; defer.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => void apply(session), 0);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [nonce]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    queryClient.clear();
    setState({ status: "signed_out" });
  }, [queryClient]);

  const recheck = useCallback(() => {
    setState({ status: "loading" });
    setNonce((n) => n + 1);
  }, []);

  return <AuthContext value={{ state, signOut, recheck }}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useAdminIdentity() {
  const { state } = useAuth();
  if (state.status !== "admin") return null;
  return { email: state.email, userId: state.userId };
}
