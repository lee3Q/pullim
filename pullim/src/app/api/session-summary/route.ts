import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";

// POST /api/session-summary — 세션 요약 저장
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }

  const {
    userId,
    theme,
    avgResponseTimeMs,
    avgMessageLength,
    satisfactionScore,
    completed,
  } = body;

  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 없음 → 성공으로 응답
    return NextResponse.json({ ok: true, storage: "local" });
  }

  try {
    const { error } = await supabase
      .from("session_summaries")
      .insert({
        id: nanoid(),
        user_id: userId,
        theme: theme || "모험가",
        avg_response_time_ms: avgResponseTimeMs ?? null,
        avg_message_length: avgMessageLength ?? null,
        satisfaction_score: satisfactionScore ?? null,
        completed: completed ?? false,
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
