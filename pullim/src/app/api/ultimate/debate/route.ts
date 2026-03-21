import { NextRequest, NextResponse } from "next/server";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import {
  CrystalName,
  CrystalAnalysis,
  Disagreement,
  ModelProvider,
  DebateRound,
} from "@/lib/types-ultimate";
import { getProvider, getAvailableProviders } from "@/lib/providers";
import { isDemoMode, getDemoDebate } from "@/lib/demo";

interface DebateRequest {
  analyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  selectedCrystal: CrystalName; // 사용자가 공감한 구슬
  listenSummary: string;
  crystalModelMap: Partial<Record<CrystalName, ModelProvider>>;
}

interface DebateResponse {
  rounds: DebateRound[];
  synthesis: string;
}

function buildRound1Prompt(
  attackerCrystal: CrystalName,
  attackerAnalysis: CrystalAnalysis,
  defenderCrystal: CrystalName,
  defenderAnalysis: CrystalAnalysis,
  disagreements: Disagreement[]
): string {
  const relevantDisagreements = disagreements
    .map((d) => `- ${d.topic}: ${d.userImplication}`)
    .join("\n");

  return `[너는 ${attackerCrystal}의 관점이다]
사용자가 ${defenderCrystal}의 분석에 공감했다.

[선택된 분석 — ${defenderCrystal}]
관찰: ${defenderAnalysis.observation}
통찰: ${defenderAnalysis.insight}
리스크: ${defenderAnalysis.risk}

[너의 분석 — ${attackerCrystal}]
관찰: ${attackerAnalysis.observation}
통찰: ${attackerAnalysis.insight}
리스크: ${attackerAnalysis.risk}

[핵심 불일치]
${relevantDisagreements || "명시적 불일치 없음"}

[지시]
- 선택된 분석(${defenderCrystal})에서 놓치고 있는 것 1개를 짚어라.
- 300자 이내. 한국어.
- 사용자 선택을 존중하되, 보완점은 명확히.
- 텍스트만 출력 (JSON 아님).`;
}

function buildRound2Prompt(
  defenderCrystal: CrystalName,
  round1Results: DebateRound[]
): string {
  const counterArgs = round1Results
    .map((r) => `[${r.crystal}의 반론]\n${r.content}`)
    .join("\n\n");

  return `[너는 ${defenderCrystal}의 관점이다]
다른 구슬들이 반론을 제기했다.

${counterArgs}

[지시]
- 수용할 것은 수용, 유지할 것은 유지.
- 전제 의심: 사용자가 당연시하는 전제("~해야 한다", "~밖에 없다") 1개를 찾아 "그 전제가 맞다면" 형식으로 짚어라.
- 최종 정리 300자 이내. 한국어.
- 핵심 Powerful Question 1개로 마무리 (30자 이내, 즉답 불가, 관점 전환).
- 텍스트만 출력 (JSON 아님).`;
}

function buildSynthesisPrompt(
  round1Results: DebateRound[],
  round2Result: DebateRound
): string {
  const r1 = round1Results
    .map((r) => `${r.crystal}: ${r.content}`)
    .join("\n\n");

  return `아래 토론 내용을 사용자 관점에서 2~3문장으로 종합해라.
합의된 부분과 남은 쟁점을 구분해서 정리해라.
프레임워크 이름 없이, 따뜻한 현자 톤(고어체: ~일세, ~인가)으로.

[라운드 1 반론]
${r1}

[라운드 2 최종]
${round2Result.crystal}: ${round2Result.content}`;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as DebateRequest;
  const { analyses, disagreements, selectedCrystal, listenSummary, crystalModelMap } = body;

  if (!analyses || analyses.length < 2 || !selectedCrystal || !listenSummary) {
    return NextResponse.json(
      { error: "analyses(2개 이상), selectedCrystal, listenSummary 필수" },
      { status: 400 }
    );
  }

  // Demo mode
  if (isDemoMode()) {
    const theme = (body as unknown as Record<string, unknown>).theme as string | undefined;
    const demo = getDemoDebate(theme as "모험가" | "전략실" | "달빛정원" | undefined);
    return NextResponse.json(demo);
  }

  // 위기 감지
  const crisisResult = detectCrisis(listenSummary);
  if (crisisResult.tier === "A" || crisisResult.tier === "B") {
    return NextResponse.json({
      crisis: true,
      tier: crisisResult.tier,
      debateBlocked: true,
      message: crisisResult.response!.userMessage,
      hotlines: crisisResult.response!.hotlines,
    });
  }

  const available = getAvailableProviders();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "사용 가능한 AI 모델이 없습니다." },
      { status: 500 }
    );
  }

  // 교차검증 지적: 1개 모델만 가용하면 교차 토론 불가 → 스킵
  if (available.length < 2) {
    return NextResponse.json({
      rounds: [],
      synthesis: "모델이 하나뿐이라 교차 토론을 생략했네. 구슬 분석 결과로 정리하겠네.",
      skipped: true,
    });
  }

  try {
    // 선택된 구슬 / 비선택 구슬 분리
    const selectedAnalysis = analyses.find((a) => a.crystal === selectedCrystal);
    if (!selectedAnalysis) {
      return NextResponse.json(
        { error: "selectedCrystal이 analyses에 없습니다." },
        { status: 400 }
      );
    }

    const otherAnalyses = analyses.filter((a) => a.crystal !== selectedCrystal);
    if (otherAnalyses.length === 0) {
      return NextResponse.json(
        { error: "반론할 구슬이 필요합니다." },
        { status: 400 }
      );
    }

    // 라운드 1: 비선택 구슬들이 반론 (모델 교차 — 원래 분석 모델이 아닌 다른 모델)
    const round1Promises = otherAnalyses.slice(0, 2).map(async (attacker) => {
      const prompt = buildRound1Prompt(
        attacker.crystal,
        attacker,
        selectedCrystal,
        selectedAnalysis,
        disagreements
      );

      // 모델 교차: 원래 분석한 모델이 아닌 다른 모델 선택
      const originalModel = crystalModelMap[attacker.crystal] || attacker.model;
      const crossModel = available.find((m) => m !== originalModel) || available[0];
      const provider = getProvider(crossModel);

      const result = await provider.chat({
        system: "너는 의사결정 토론 전문가다. 다른 관점의 분석에 대해 건설적 반론을 제시한다.",
        messages: [{ role: "user", content: prompt }],
        maxTokens: 500,
        temperature: 0.7,
      });

      const round: DebateRound = {
        round: 1,
        crystal: attacker.crystal,
        model: crossModel,
        content: result.text.trim(),
      };
      return round;
    });

    const round1Results = await Promise.all(round1Promises);

    // 라운드 2: 선택된 구슬이 수용/반박
    const selectedModel = crystalModelMap[selectedCrystal] || selectedAnalysis.model;
    const r2CrossModel = available.find((m) => m !== selectedModel) || available[0];
    const r2Provider = getProvider(r2CrossModel);

    const round2Response = await r2Provider.chat({
      system: "너는 의사결정 토론 전문가다. 반론을 검토하고 최종 정리한다.",
      messages: [
        { role: "user", content: buildRound2Prompt(selectedCrystal, round1Results) },
      ],
      maxTokens: 500,
      temperature: 0.7,
    });

    const round2: DebateRound = {
      round: 2,
      crystal: selectedCrystal,
      model: r2CrossModel,
      content: round2Response.text.trim(),
    };

    // 합성
    const synthesisProvider = available.includes("claude")
      ? getProvider("claude")
      : getProvider(available[0]);

    const synthesisResponse = await synthesisProvider.chat({
      system: "너는 현자다. 고어체(~일세, ~인가)로 토론을 종합한다.",
      messages: [
        { role: "user", content: buildSynthesisPrompt(round1Results, round2) },
      ],
      maxTokens: 400,
      temperature: 0.5,
    });

    const response: DebateResponse = {
      rounds: [...round1Results, round2],
      synthesis: synthesisResponse.text.trim(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ultimate debate error:", error);
    return NextResponse.json(
      { error: "구슬 토론 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
