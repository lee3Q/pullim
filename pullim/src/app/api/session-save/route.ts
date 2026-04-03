import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";

// POST /api/session-save — 세션 완료 시 Supabase 저장
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const {
    user_id,
    session_id,
    theme,
    summary,
    turn_count,
    cheat_count,
    messages_count,
    entry_mode,
    created_at,
  } = body;

  if (!user_id) {
    return NextResponse.json({ error: "user_id required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 없음 → 성공으로 응답 (localStorage 폴백)
    return NextResponse.json({ ok: true, storage: "local" });
  }

  try {
    const { error } = await supabase.from("sessions").insert({
      user_id,
      session_id: session_id || "",
      theme: theme || "모험가",
      summary: summary ?? null,
      turn_count: turn_count ?? 0,
      cheat_count: cheat_count ?? 0,
      messages_count: messages_count ?? 0,
      entry_mode: entry_mode || "concern",
      created_at: created_at || new Date().toISOString(),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ ok: true, storage: "supabase" });
}
