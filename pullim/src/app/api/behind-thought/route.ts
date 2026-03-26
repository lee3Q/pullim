import { NextRequest, NextResponse } from "next/server";
import { inferStateWithLLM } from "@/lib/session/behind-llm";
import { inferStateSync } from "@/lib/session/behind-the-scenes";
import { isDemoMode } from "@/lib/demo";
import type { BehaviorSignals } from "@/lib/personalization/behavior-reader";
import type { BehindEvent, LadderMessage, LadderLevel } from "@/lib/session/ladder-types";

export async function POST(req: NextRequest) {
  const { signals, events, currentLevel, recentMessages } = (await req.json()) as {
    signals: BehaviorSignals;
    events: BehindEvent[];
    currentLevel: LadderLevel;
    recentMessages: LadderMessage[];
  };

  // 데모 모드 → 규칙 기반 즉시 반환
  if (isDemoMode()) {
    return NextResponse.json(inferStateSync(signals, events, currentLevel));
  }

  // LLM 추론 시도 → 실패 시 규칙 기반 폴백
  try {
    const result = await inferStateWithLLM(signals, events, currentLevel, recentMessages);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(inferStateSync(signals, events, currentLevel));
  }
}
