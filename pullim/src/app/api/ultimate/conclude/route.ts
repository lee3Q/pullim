import { NextRequest, NextResponse } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import {
  CrystalAnalysis,
  Disagreement,
  DebateRound,
  ConclusionData,
} from "@/lib/types-ultimate";
import { isDemoMode, getDemoConclusion } from "@/lib/demo";

interface ConcludeRequest {
  concern: string;
  listenSummary: string;
  analyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  debateRounds: DebateRound[];
  debateSynthesis: string;
  userName: string | null;
}

function buildConcludePrompt(data: ConcludeRequest): string {
  const analysisText = data.analyses
    .map(
      (a) =>
        `[${a.crystal} (${a.model})]\n관찰: ${a.observation}\n통찰: ${a.insight}\n리스크: ${a.risk}`
    )
    .join("\n\n");

  const disagreementText =
    data.disagreements.length > 0
      ? data.disagreements
          .map((d) => `- ${d.topic} (${d.severity}): ${d.userImplication}`)
          .join("\n")
      : "구슬들이 같은 방향을 가리키고 있음";

  const debateText = data.debateRounds
    .map((r) => `[R${r.round} ${r.crystal}] ${r.content}`)
    .join("\n\n");

  return `너는 현자다. 모닥불 앞에서 세션 전체를 종합하여 결론을 내린다.

[톤]
- 고어체: "~일세", "~인가", "~하게"
- 따뜻하지만 직설적. 답을 주지 않되, 갈림길을 선명하게 비춰줌.
- 시그니처 문장: "자네는 이미 답을 알고 있지 않은가?"

[사용자]
이름: ${data.userName || "모험가"}
고민: ${data.concern}

[경청 요약]
${data.listenSummary}

[구슬 분석]
${analysisText}

[불일치]
${disagreementText}

[토론]
${debateText}

[토론 종합]
${data.debateSynthesis}

[지시]
위 전체 세션 데이터를 종합하여 아래 JSON을 생성해라.
- situationSummary: 상황 요약 (3~4문장, 현자 톤)
- options: 선택지 2~3개. 각각 direction(방향), risk(리스크), reward(보상)
- keyCrossroad: 핵심 갈림길 1문장 (불일치에서 도출)
- userTendency: 발화 패턴에서 보이는 사용자 성향 1문장

결론 마지막에 "자네는 이미 답을 알고 있지 않은가?" 를 situationSummary에 포함시켜라.

[출력 형식 — JSON만]
{
  "situationSummary": "...",
  "options": [
    { "direction": "...", "risk": "...", "reward": "..." }
  ],
  "keyCrossroad": "...",
  "userTendency": "..."
}`;
}

function parseJSON<T>(text: string, fallback: T): T {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
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
  const body = (await req.json()) as ConcludeRequest;
  const { concern, listenSummary, analyses, debateRounds, debateSynthesis } = body;

  if (!concern || !listenSummary || !analyses || analyses.length === 0) {
    return NextResponse.json(
      { error: "concern, listenSummary, analyses 필수" },
      { status: 400 }
    );
  }

  // Demo mode
  if (isDemoMode()) {
    const theme = (body as unknown as Record<string, unknown>).theme as string | undefined;
    return NextResponse.json({ conclusion: getDemoConclusion(theme as "모험가" | "전략실" | "달빛정원" | undefined) });
  }

  // 위기 감지 (설계 원칙: 모든 사용자 입력에 적용)
  const crisisResult = detectCrisis(concern);
  if (crisisResult.tier === "A") {
    return NextResponse.json({
      crisis: true,
      message: crisisResult.response!.userMessage,
      hotlines: crisisResult.response!.hotlines,
    });
  }

  let client;
  try {
    client = getClient();
  } catch {
    return NextResponse.json(
      { error: "AI 서비스에 일시적인 문제가 있습니다." },
      { status: 500 }
    );
  }

  try {
    const response = await client.messages.create({
      model: PIPELINE_MODEL,
      max_tokens: 1200,
      messages: [{ role: "user", content: buildConcludePrompt(body) }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const conclusion = parseJSON<ConclusionData>(rawText, {
      situationSummary: rawText.slice(0, 500),
      options: [
        { direction: "현 상태 유지", risk: "변화 없음", reward: "안정" },
        { direction: "새로운 시도", risk: "불확실성", reward: "성장 가능성" },
      ],
      keyCrossroad: "핵심 갈림길을 정리하지 못했습니다.",
      userTendency: "",
    });

    return NextResponse.json({ conclusion });
  } catch (error) {
    console.error("Ultimate conclude error:", error);
    return NextResponse.json(
      { error: "결론 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
