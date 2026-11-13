import { NextRequest, NextResponse } from "next/server";
import { getSessionSaveAccess } from "@/lib/supabase/session-save-auth";

// Existing sessions schema and RLS are unchanged. Identity comes from verified auth.
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || typeof body.user_id !== "string" || !body.user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }
  const { id, user_id, session_id, theme, summary, turn_count, cheat_count, messages_count, entry_mode, created_at } = body;
  if (id !== undefined && (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
    return NextResponse.json({ error: "invalid save id" }, { status: 400 });
  }
  const access = await getSessionSaveAccess(req.headers.get("authorization"), user_id);
  if (access.kind === "local") return NextResponse.json({ ok: true, storage: "local" });
  if (access.kind === "error") return NextResponse.json({ error: access.message }, { status: access.status });

  const record = {
    ...(id ? { id } : {}),
    user_id: access.userId,
    session_id: session_id || "",
    theme: theme || "모험가",
    summary: summary ?? null,
    turn_count: turn_count ?? 0,
    cheat_count: cheat_count ?? 0,
    messages_count: messages_count ?? 0,
    entry_mode: entry_mode || "concern",
    created_at: created_at || new Date().toISOString(),
  };
  try {
    const { error } = await access.client.from("sessions").insert(record);
    if (error) {
      // A retry reuses the existing primary key. Never overwrite a previous save.
      if (id && error.code === "23505") {
        const { data: existing, error: readError } = await access.client.from("sessions")
          .select("id,user_id,session_id,theme,summary,turn_count,cheat_count,messages_count,entry_mode,created_at")
          .eq("id", id).eq("user_id", access.userId).maybeSingle();
        if (readError) return NextResponse.json({ error: "저장 여부를 확인하지 못했습니다." }, { status: 503 });
        const same = existing && Object.entries(record).every(([key, value]) => key === "created_at"
          ? new Date(existing[key]).getTime() === new Date(value as string).getTime()
          : existing[key as keyof typeof existing] === value);
        if (!same) return NextResponse.json({ error: "이 저장 번호는 다른 기록에 사용되었습니다." }, { status: 409 });
      } else {
        return NextResponse.json({ error: "계정에 저장하지 못했습니다." }, { status: 500 });
      }
    }
  } catch {
    return NextResponse.json({ error: "계정 저장 여부를 확인하지 못했습니다." }, { status: 503 });
  }
  return NextResponse.json({ ok: true, storage: "supabase" });
}
