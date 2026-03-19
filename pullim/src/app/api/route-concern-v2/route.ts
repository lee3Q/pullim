import { NextRequest, NextResponse } from "next/server";
import { getClient, ROUTING_MODEL } from "@/lib/llm/claude";
import { ROUTING_V2_PROMPT, SYSTEM_BASE_V2 } from "@/lib/llm/prompts-v2";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { getRecommendedExperts } from "@/lib/llm/expert-recommend";
import { ConcernType, ExpertName, RoutingScoresV2 } from "@/lib/types-v2";

interface V2RoutingResult {
  scores: RoutingScoresV2;
  concernType: ConcernType;
  recommendedExperts: [ExpertName, ExpertName, ExpertName];
  explanation: string;
}

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "입력이 필요합니다" }, { status: 400 });
  }

  // Safety: Tier A crisis detection
  const crisisResult = detectCrisis(input);
  if (crisisResult.tier === "A") {
    return NextResponse.json({
      crisis: true,
      tier: "A",
      message: crisisResult.response!.userMessage,
      hotlines: crisisResult.response!.hotlines,
    });
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    console.error("Claude client init error:", error);
    return NextResponse.json(
      { error: "AI 서비스에 일시적인 문제가 있습니다." },
      { status: 500 }
    );
  }

  try {
    const response = await client.messages.create({
      model: ROUTING_MODEL,
      max_tokens: 512,
      system: `${SYSTEM_BASE_V2}\n\n${ROUTING_V2_PROMPT}`,
      messages: [{ role: "user", content: input }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    let result: V2RoutingResult;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found");
      const parsed = JSON.parse(jsonMatch[0]);

      const concernType: ConcernType = parsed.concern_type || "general";
      const experts = parsed.recommended_experts as ExpertName[] | undefined;
      const validExperts: [ExpertName, ExpertName, ExpertName] =
        experts && experts.length >= 3
          ? [experts[0], experts[1], experts[2]]
          : getRecommendedExperts(concernType);

      result = {
        scores: parsed.scores,
        concernType,
        recommendedExperts: validExperts,
        explanation: parsed.explanation,
      };
    } catch {
      // Fallback
      result = {
        scores: {
          reversibility: 0.5,
          info_sufficiency: 0.5,
          emotional_involvement: 0.5,
          time_pressure: 0.5,
        },
        concernType: "general",
        recommendedExperts: getRecommendedExperts("general"),
        explanation: "고민을 여러 관점에서 함께 살펴볼게요. 천천히 이야기해주세요.",
      };
    }

    // Tier B safety flag
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
    console.error("V2 Routing error:", error);
    return NextResponse.json(
      { error: "AI 서비스에 일시적인 문제가 있습니다." },
      { status: 500 }
    );
  }
}
