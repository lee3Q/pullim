"use client";

import { useEffect, useState } from "react";
import {
  getSupabase,
  isSupabaseAvailable,
  signInWithEmail,
  signUpWithEmail,
  signOut as supabaseSignOut,
} from "@/lib/supabase/client";

interface AuthUser {
  id: string;
  email: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isSupabaseReady: boolean;
}

export function useAuth(): UseAuthReturn {
  const isSupabaseReady = isSupabaseAvailable();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(isSupabaseReady);

  useEffect(() => {
    if (!isSupabaseReady) {
      return;
    }

    const client = getSupabase();
    if (!client) {
      const timer = window.setTimeout(() => setLoading(false), 0);
      return () => window.clearTimeout(timer);
    }

    // 초기 세션 확인
    client.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u && u.email) {
        setUser({ id: u.id, email: u.email });
      }
      setLoading(false);
    });

    // 상태 변경 구독
    const { data: subscription } = client.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user;
        if (u && u.email) {
          setUser({ id: u.id, email: u.email });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [isSupabaseReady]);

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const result = await signInWithEmail(email, password);
    return { error: result.error };
  };

  const signUp = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const result = await signUpWithEmail(email, password);
    return { error: result.error };
  };

  const signOut = async (): Promise<void> => {
    await supabaseSignOut();
    setUser(null);
  };

  if (!isSupabaseReady) {
    return {
      user: null,
      loading: false,
      signIn: async () => ({ error: null }),
      signUp: async () => ({ error: null }),
      signOut: async () => {},
      isSupabaseReady: false,
    };
  }

  return { user, loading, signIn, signUp, signOut, isSupabaseReady };
}
