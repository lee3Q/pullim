import type { SupabaseClient } from "@supabase/supabase-js";

export interface CompletedSessionSave {
  id: string;
  session_id: string;
  theme: string;
  summary: string;
  turn_count: number;
  cheat_count: number;
  messages_count: number;
  entry_mode: string;
  created_at: string;
}

export async function saveCompletedSession(
  client: SupabaseClient | null,
  expectedUserId: string,
  payload: CompletedSessionSave,
  send: typeof fetch = fetch,
): Promise<boolean> {
  if (!client) return false;
  try {
    const { data, error } = await client.auth.getSession();
    const session = data.session;
    // A retry must never move a previous account's summary into a new account.
    if (error || !session || session.user.id !== expectedUserId || !session.access_token) return false;
    const response = await send("/api/session-save", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...payload, user_id: expectedUserId }),
    });
    if (!response.ok) return false;
    const result = await response.json();
    // An unconfigured server is not evidence of account storage.
    return result.ok === true && result.storage === "supabase";
  } catch {
    return false;
  }
}
