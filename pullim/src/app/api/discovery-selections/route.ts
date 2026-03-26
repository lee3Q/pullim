import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/client";

// POST /api/discovery-selections — 스토리 파악 선택 기록 저장
export async function POST(req: NextRequest) {
  const { userId, theme, selections, profile } = await req.json();

  if (!userId || !selections) {
    return NextResponse.json(
      { error: "userId and selections required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: true, storage: "local" });
  }

  const { error } = await supabase.from("discovery_selections").insert({
    id: nanoid(),
    user_id: userId,
    theme: theme || "garden",
    selections, // JSONB — StorySelectionRecord[]
    profile, // JSONB — ProbabilityProfile
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, storage: "supabase" });
}

// GET /api/discovery-selections?userId=xxx — 최근 파악 기록 조회
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId required" },
      { status: 400 }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ records: [] });
  }

  const { data, error } = await supabase
    .from("discovery_selections")
    .select("id, theme, selections, profile, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ records: data || [] });
}
