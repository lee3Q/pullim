import { NextRequest, NextResponse } from "next/server";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { DataCard, CrisisLevel } from "@/lib/types-ultimate";
import { isDemoMode, DEMO_RESEARCH_CARDS } from "@/lib/demo";

interface ResearchRequest {
  concern: string;
  listenSummary: string;
  concernType?: string;
}

interface ResearchResponse {
  cards: DataCard[];
  safetyLevel: CrisisLevel;
  skipped: boolean;
}

const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || "sonar";

function buildResearchPrompt(concern: string, listenSummary: string): string {
  return `사용자가 다음 고민을 가지고 있다:

[고민]
${concern}

[경청 요약]
${listenSummary}

이 고민에 대해 데이터 기반으로 도움이 될 정보를 검색하여 정리해라.
반드시 아래 3가지 관점에서 각각 1개씩 핵심 팩트를 찾아라:

1. 📊 통계/수치 — 관련된 실제 데이터나 통계
2. 💡 유사 사례 — 비슷한 상황의 실제 사례나 경험
3. 🔬 전문가 견해 — 관련 분야 전문가나 연구의 견해

각 항목에 대해 아래 JSON 형식으로 출력:
[
  {
    "title": "📊 관련 통계",
    "fact": "핵심 팩트 1~2문장",
    "source": { "name": "출처명", "url": "URL 또는 빈 문자열" },
    "confidence": "high 또는 medium 또는 low"
  },
  {
    "title": "💡 유사 사례",
    "fact": "핵심 팩트 1~2문장",
    "source": { "name": "출처명", "url": "" },
    "confidence": "high 또는 medium 또는 low"
  },
  {
    "title": "🔬 전문가 견해",
    "fact": "핵심 팩트 1~2문장",
    "source": { "name": "출처명", "url": "" },
    "confidence": "high 또는 medium 또는 low"
  }
]

JSON 배열만 출력. 다른 텍스트 없이.`;
}

function parseJSON<T>(text: string, fallback: T): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const braceMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as T;
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ResearchRequest;
  const { concern, listenSummary } = body;

  if (!concern || !listenSummary) {
    return NextResponse.json(
      { error: "concern, listenSummary 필수" },
      { status: 400 }
    );
  }

  // Demo mode
  if (isDemoMode()) {
    return NextResponse.json({ cards: DEMO_RESEARCH_CARDS, safetyLevel: "GREEN", skipped: false });
  }

  // 위기 감지
  const crisisResult = detectCrisis(concern);
  let safetyLevel: CrisisLevel = "GREEN";
  if (crisisResult.tier === "A") safetyLevel = "RED";
  else if (crisisResult.tier === "B") safetyLevel = "YELLOW";

  if (safetyLevel === "RED") {
    return NextResponse.json({
      crisis: true,
      safetyLevel: "RED",
      message: crisisResult.response!.userMessage,
      hotlines: crisisResult.response!.hotlines,
    });
  }

  // Perplexity API 키 확인 — 없으면 스킵
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      cards: [],
      safetyLevel,
      skipped: true,
    } satisfies ResearchResponse);
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PERPLEXITY_MODEL,
        messages: [
          {
            role: "system",
            content: "너는 리서치 에이전트다. 사용자 고민에 관련된 데이터, 통계, 사례를 검색하여 JSON으로 정리한다. 한국어로 응답해라.",
          },
          {
            role: "user",
            content: buildResearchPrompt(concern, listenSummary),
          },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error("Perplexity API error:", response.status, await response.text());
      // 실패해도 세션 중단하지 않음
      return NextResponse.json({
        cards: [],
        safetyLevel,
        skipped: true,
      } satisfies ResearchResponse);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content ?? "";

    const cards = parseJSON<DataCard[]>(rawText, []);

    // 유효성 검증: DataCard 형태인지 확인
    const validCards = (Array.isArray(cards) ? cards : [])
      .filter(
        (c) =>
          c &&
          typeof c.title === "string" &&
          typeof c.fact === "string" &&
          c.title.length > 0 &&
          c.fact.length > 0
      )
      .map((c) => ({
        title: c.title,
        fact: c.fact,
        source: {
          name: c.source?.name || "리서치 에이전트",
          url: c.source?.url || "",
        },
        confidence: (["high", "medium", "low"].includes(c.confidence) ? c.confidence : "medium") as "high" | "medium" | "low",
      }));

    return NextResponse.json({
      cards: validCards,
      safetyLevel,
      skipped: false,
    } satisfies ResearchResponse);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json({
      cards: [],
      safetyLevel,
      skipped: true,
    } satisfies ResearchResponse);
  }
}
