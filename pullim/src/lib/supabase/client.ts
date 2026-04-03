// Supabase 클라이언트 — 환경변수 없으면 null 반환 (localStorage 폴백용)
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  supabase = createClient(url, key);
  return supabase;
}

export function isSupabaseAvailable(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Auth 함수 — Supabase 없으면 null/빈값 반환 (에러 아님)

export async function getAuthUser(): Promise<{
  id: string;
  email: string;
} | null> {
  try {
    const client = getSupabase();
    if (!client) return null;
    const { data } = await client.auth.getUser();
    if (!data.user || !data.user.email) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ user: { id: string } | null; error: string | null }> {
  try {
    const client = getSupabase();
    if (!client) return { user: null, error: null };
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { user: null, error: error.message };
    return { user: data.user ? { id: data.user.id } : null, error: null };
  } catch {
    return { user: null, error: "로그인 중 오류가 발생했습니다." };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<{ user: { id: string } | null; error: string | null }> {
  try {
    const client = getSupabase();
    if (!client) return { user: null, error: null };
    const { data, error } = await client.auth.signUp({ email, password });
    if (error) return { user: null, error: error.message };
    return { user: data.user ? { id: data.user.id } : null, error: null };
  } catch {
    return { user: null, error: "회원가입 중 오류가 발생했습니다." };
  }
}

export async function signOut(): Promise<void> {
  try {
    const client = getSupabase();
    if (!client) return;
    await client.auth.signOut();
  } catch {
    // 에러 무시
  }
}
