export interface SupabaseQueryError {
  code?: string;
  message: string;
  status?: number;
}

export interface MinimalSupabaseTableClient {
  insert(values: Record<string, unknown>): Promise<{ data: unknown; error: SupabaseQueryError | null }>;
  select(columns: string): {
    eq(column: string, value: string): {
      eq(column2: string, value2: string): {
        maybeSingle(): Promise<{ data: Record<string, unknown> | null; error: SupabaseQueryError | null }>;
      };
    };
  };
}

export interface MinimalSupabaseClient {
  from(table: string): MinimalSupabaseTableClient;
}

export type SessionSaveAccess =
  | { kind: "local" }
  | { kind: "authenticated"; client: MinimalSupabaseClient; userId: string }
  | { kind: "error"; status: number; message: string };

function createRestClient(baseUrl: string, apiKey: string, token: string): MinimalSupabaseClient {
  const normalizedBase = baseUrl.replace(/\/$/, "");
  const headers = {
    apikey: apiKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  return {
    from(table: string): MinimalSupabaseTableClient {
      return {
        async insert(values: Record<string, unknown>) {
          try {
            const res = await fetch(`${normalizedBase}/rest/v1/${encodeURIComponent(table)}`, {
              method: "POST",
              headers,
              body: JSON.stringify(values),
              signal: AbortSignal.timeout(15000),
            });
            const body = await res.json().catch(() => ({})) as Record<string, unknown>;
            if (!res.ok) {
              return {
                data: null,
                error: {
                  code: typeof body.code === "string" ? body.code : undefined,
                  message: typeof body.message === "string" ? body.message : `HTTP ${res.status}`,
                  status: res.status,
                },
              };
            }
            return { data: body, error: null };
          } catch (err) {
            return {
              data: null,
              error: { message: err instanceof Error ? err.message : "network error", status: 0 },
            };
          }
        },
        select(columns: string) {
          const filters: [string, string][] = [];
          const chain = {
            eq(col: string, val: string) {
              filters.push([col, val]);
              return {
                eq(col2: string, val2: string) {
                  filters.push([col2, val2]);
                  return {
                    async maybeSingle() {
                      try {
                        const params = new URLSearchParams({ select: columns });
                        for (const [k, v] of filters) {
                          params.set(k, `eq.${v}`);
                        }
                        const res = await fetch(
                          `${normalizedBase}/rest/v1/${encodeURIComponent(table)}?${params.toString()}`,
                          {
                            method: "GET",
                            headers,
                            signal: AbortSignal.timeout(15000),
                          },
                        );
                        const body = await res.json().catch(() => null);
                        if (!res.ok) {
                          return {
                            data: null,
                            error: {
                              message: `HTTP ${res.status}`,
                              status: res.status,
                            },
                          };
                        }
                        const row = Array.isArray(body) ? (body[0] ?? null) : body;
                        return { data: (row as Record<string, unknown> | null) ?? null, error: null };
                      } catch (err) {
                        return {
                          data: null,
                          error: { message: err instanceof Error ? err.message : "network error", status: 0 },
                        };
                      }
                    },
                  };
                },
              };
            },
          };
          return chain;
        },
      };
    },
  };
}

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
  const client = createRestClient(url, key, token);
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const unavailable = res.status >= 500;
      return {
        kind: "error",
        status: unavailable ? 503 : 401,
        message: unavailable ? "로그인 상태를 확인하지 못했습니다." : "로그인을 다시 확인해 주세요.",
      };
    }
    const user = (await res.json()) as { id?: string } | null;
    if (!user || typeof user.id !== "string" || !user.id) {
      return { kind: "error", status: 401, message: "로그인을 다시 확인해 주세요." };
    }
    if (user.id !== requestedUserId) {
      return { kind: "error", status: 403, message: "현재 로그인한 계정과 저장할 계정이 다릅니다." };
    }
    return { kind: "authenticated", client, userId: user.id };
  } catch {
    return { kind: "error", status: 503, message: "로그인 상태를 확인하지 못했습니다." };
  }
}
