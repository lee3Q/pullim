import { NextRequest, NextResponse } from "next/server";
import { routeConcern } from "@/lib/llm/router";
import { detectCrisis } from "@/lib/safety/crisis-detector";

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "입력이 필요합니다" }, { status: 400 });
  }

  // 안전 레이어 — Tier A: 즉시 중단
  const crisisResult = detectCrisis(input);
  if (crisisResult.tier === "A") {
    return NextResponse.json({
      crisis: true,
      tier: "A",
      message: crisisResult.response!.userMessage,
      hotlines: crisisResult.response!.hotlines,
    });
  }

  try {
    const result = await routeConcern(input);

    // Tier B: 라우팅 결과에 안전 가드 플래그 추가
    if (crisisResult.tier === "B") {
      return NextResponse.json({
        ...result,
        safetyGuard: {
          tier: "B",
          message: crisisResult.response!.userMessage,
          hotlines: crisisResult.response!.hotlines,
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Routing error:", error);
    return NextResponse.json(
      { error: "AI 서비스에 일시적인 문제가 있습니다." },
      { status: 500 }
    );
  }
}
