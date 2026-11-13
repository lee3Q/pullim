import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SessionSaveAccess =
  | { kind: "local" }
  | { kind: "authenticated"; client: SupabaseClient; userId: string }
  | { kind: "error"; status: number; message: string };

// A new client belongs to this request only. Never reuse browser or server auth state.
export async function getSessionSaveAccess(
  authorization: string | null,
  requestedUserId: string,
): Promise<SessionSaveAccess> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { kind: "local" };
  const match = authorization?.match(/^Bearer (\S+)$/i);
  if (!match) return { kind: "error", status: 401, message: "로그인이 필요합니다." };

  const token = match[1];
  const client = createClient(url, key, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
      fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
    },
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user) {
      const unavailable = error && (error.status === 0 || (error.status ?? 0) >= 500 || error.name === "AuthRetryableFetchError");
      return { kind: "error", status: unavailable ? 503 : 401, message: unavailable ? "로그인 상태를 확인하지 못했습니다." : "로그인을 다시 확인해 주세요." };
    }
    if (data.user.id !== requestedUserId) {
      return { kind: "error", status: 403, message: "현재 로그인한 계정과 저장할 계정이 다릅니다." };
    }
    return { kind: "authenticated", client, userId: data.user.id };
  } catch {
    return { kind: "error", status: 503, message: "로그인 상태를 확인하지 못했습니다." };
  }
}
