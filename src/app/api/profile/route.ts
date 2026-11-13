import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";

// GET /api/profile?userId=xxx — 프로필 조회
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 없음 → 빈 응답 (클라이언트가 localStorage 폴백)
    return NextResponse.json({ profile: null, sessionCount: 0 });
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("profile, session_count, last_session_at")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ profile: null, sessionCount: 0 });
  }

  // 최근 세션 만족도 조회
  const { data: lastSession } = await supabase
    .from("session_summaries")
    .select("satisfaction_score, completed")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 완료된 세션 수
  const { count: completedCount } = await supabase
    .from("session_summaries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("completed", true);

  return NextResponse.json({
    profile: data.profile,
    sessionCount: data.session_count || 0,
    lastSatisfaction: lastSession?.satisfaction_score ?? null,
    completedSessions: completedCount || 0,
  });
}

// POST /api/profile — 프로필 생성/갱신
export async function POST(req: NextRequest) {
  const { userId, profile, sessionCount } = await req.json();

  if (!userId || !profile) {
    return NextResponse.json({ error: "userId and profile required" }, { status: 400 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    // Supabase 없음 → 성공으로 응답 (클라이언트가 localStorage에 이미 저장)
    return NextResponse.json({ ok: true, storage: "local" });
  }

  const { error } = await supabase
    .from("user_profiles")
    .upsert({
      user_id: userId,
      profile,
      session_count: sessionCount || 1,
      last_session_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, storage: "supabase" });
}
