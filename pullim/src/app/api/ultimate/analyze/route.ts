import { NextRequest, NextResponse } from "next/server";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import {
  CrystalName,
  CrystalAnalysis,
  Disagreement,
  ModelProvider,
  CRYSTALS,
  CrisisLevel,
} from "@/lib/types-ultimate";
import {
  getProvider,
  getAvailableProviders,
  parallelChat,
} from "@/lib/providers";
import { isDemoMode, getDemoAnalyses, DEMO_DISAGREEMENTS } from "@/lib/demo";

interface AnalyzeRequest {
  sessionId: string;
  selectedCrystals: CrystalName[];
  listenSummary: string;
  concern: string;
}

interface AnalyzeResponse {
  analyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  crystalModelMap: Partial<Record<CrystalName, ModelProvider>>;
  safetyLevel: CrisisLevel;
}

// 라운드 로빈: session_id 해시 → 시작 오프셋
function hashSessionId(sessionId: string): number {
  let hash = 0;
  for (let i = 0; i < sessionId.length; i++) {
    hash = (hash * 31 + sessionId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function assignModels(
  sessionId: string,
  crystals: CrystalName[],
  available: ModelProvider[]
): Record<CrystalName, ModelProvider> {
  const offset = hashSessionId(sessionId) % available.length;
  const map: Record<string, ModelProvider> = {};
  crystals.forEach((crystal, i) => {
    map[crystal] = available[(offset + i) % available.length];
  });
  return map as Record<CrystalName, ModelProvider>;
}

function buildCrystalAnalysisPrompt(
  crystalName: CrystalName,
  concern: string,
  listenSummary: string
): string {
  const crystal = CRYSTALS.find((c) => c.name === crystalName);
  if (!crystal) throw new Error(`Unknown crystal: ${crystalName}`);

  return `[분석 렌즈: ${crystal.label}]
이 렌즈는 "${crystal.description}"
분석 초점: ${crystal.analysisFocus}

[사용자 상황]
${concern}

[경청 요약]
${listenSummary}

[분석 규칙]
- 이 렌즈의 관점에서만 분석해라.
- 500자 이내.
- 구체적 수치와 근거를 포함해라.
- 다른 렌즈의 관점을 참조하지 마라.
- 한국어로 작성.
- 사용자의 자기가치감을 흔드는 분석 금지. 성향/패턴 지적 시 부정적 프레이밍 대신 중립적 관찰.

[Powerful Question — 마지막 질문 기준]
- 30자 이내, 즉답 불가(Yes/No 아님), 관점을 전환시키는 질문.
- (O) "그 선택이 3년 뒤의 자네에게는 어떤 의미인가?"
- (X) "이 리스크가 크다고 생각하는가?" — 즉답 가능, 금지.

[출력 형식 — 반드시 JSON]
{
  "observation": "이 렌즈로 본 현실",
  "insight": "보이지 않던 것",
  "risk": "이 관점의 리스크",
  "question": "사용자에게 질문"
}`;
}

function buildDisagreementPrompt(analyses: CrystalAnalysis[]): string {
  const analysisTexts = analyses
    .map(
      (a) =>
        `[${a.crystal} (${a.model})]\nobservation: ${a.observation}\ninsight: ${a.insight}\nrisk: ${a.risk}`
    )
    .join("\n\n");

  return `아래 3개 분석에서 서로 다른 방향을 제시하는 지점(불일치)을 찾아라.

${analysisTexts}

[규칙]
- 불일치가 없으면 빈 배열 반환.
- 각 불일치에 대해: 주제, 각 관점의 입장, 심각도(minor/major/critical), 사용자에게의 의미를 정리.
- 한국어로 작성.

[출력 형식 — JSON 배열]
[
  {
    "topic": "불일치 주제",
    "positions": [
      { "crystal": "구슬명", "model": "모델명", "stance": "요약" }
    ],
    "severity": "minor|major|critical",
    "userImplication": "사용자에게 의미"
  }
]`;
}

function parseJSON<T>(text: string, fallback: T): T {
  // JSON 블록 추출 시도
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // 중괄호/대괄호로 시작하는 부분만 추출 시도
    const braceMatch = jsonStr.match(/[\[{][\s\S]*[\]}]/);
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
  const body = (await req.json()) as AnalyzeRequest;
  const { sessionId, selectedCrystals, listenSummary, concern } = body;

  if (!sessionId || !selectedCrystals || selectedCrystals.length === 0 || !listenSummary || !concern) {
    return NextResponse.json(
      { error: "sessionId, selectedCrystals, listenSummary, concern 필수" },
      { status: 400 }
    );
  }

  // Demo mode
  if (isDemoMode()) {
    const analyses = getDemoAnalyses(selectedCrystals);
    return NextResponse.json({
      analyses,
      disagreements: DEMO_DISAGREEMENTS,
      crystalModelMap: Object.fromEntries(analyses.map((a) => [a.crystal, a.model])),
      safetyLevel: "GREEN",
    });
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

  // 사용 가능한 프로바이더 확인
  const available = getAvailableProviders();
  if (available.length === 0) {
    return NextResponse.json(
      { error: "사용 가능한 AI 모델이 없습니다. API 키를 확인해주세요." },
      { status: 500 }
    );
  }

  // 모델 배정 (라운드 로빈)
  const crystalModelMap = assignModels(sessionId, selectedCrystals, available);

  try {
    // 구슬별 병렬 분석
    const calls = selectedCrystals.map((crystal) => ({
      provider: crystalModelMap[crystal],
      params: {
        system: "너는 의사결정 분석 전문가다. 주어진 렌즈(관점)로만 분석하고, JSON으로만 응답해라.",
        messages: [
          {
            role: "user" as const,
            content: buildCrystalAnalysisPrompt(crystal, concern, listenSummary),
          },
        ],
        maxTokens: 800,
        temperature: 0.7,
      },
    }));

    const results = await parallelChat(calls);

    // 결과 파싱 + 폴백 처리
    const analyses: CrystalAnalysis[] = [];
    const failedCrystals: { crystal: CrystalName; error: string }[] = [];

    for (let i = 0; i < results.length; i++) {
      const { provider, result } = results[i];
      const crystal = selectedCrystals[i];

      if (result instanceof Error) {
        failedCrystals.push({ crystal, error: result.message });
        continue;
      }

      const parsed = parseJSON<{
        observation: string;
        insight: string;
        risk: string;
        question: string;
      }>(result.text, {
        observation: result.text.slice(0, 200),
        insight: "",
        risk: "",
        question: "",
      });

      analyses.push({
        crystal,
        model: provider,
        observation: parsed.observation,
        insight: parsed.insight,
        risk: parsed.risk,
        question: parsed.question,
        latencyMs: result.latencyMs,
      });
    }

    // 폴백: 실패한 구슬은 사용 가능한 다른 모델로 재시도
    if (failedCrystals.length > 0 && analyses.length > 0) {
      const workingProvider = analyses[0].model;
      const fallbackProvider = getProvider(workingProvider);

      for (const { crystal } of failedCrystals) {
        try {
          const fallbackResult = await fallbackProvider.chat({
            system: "너는 의사결정 분석 전문가다. 주어진 렌즈(관점)로만 분석하고, JSON으로만 응답해라.",
            messages: [
              {
                role: "user",
                content: buildCrystalAnalysisPrompt(crystal, concern, listenSummary),
              },
            ],
            maxTokens: 800,
            temperature: 0.7,
          });

          const parsed = parseJSON<{
            observation: string;
            insight: string;
            risk: string;
            question: string;
          }>(fallbackResult.text, {
            observation: fallbackResult.text.slice(0, 200),
            insight: "",
            risk: "",
            question: "",
          });

          analyses.push({
            crystal,
            model: workingProvider,
            observation: parsed.observation,
            insight: parsed.insight,
            risk: parsed.risk,
            question: parsed.question,
            latencyMs: fallbackResult.latencyMs,
          });

          // 맵 업데이트
          crystalModelMap[crystal] = workingProvider;
        } catch {
          // 폴백도 실패 — 해당 구슬은 결과 없음
        }
      }
    }

    if (analyses.length === 0) {
      return NextResponse.json(
        { error: "모든 모델에서 분석에 실패했습니다." },
        { status: 500 }
      );
    }

    // 불일치 감지 (분석 2개 이상일 때만)
    let disagreements: Disagreement[] = [];
    if (analyses.length >= 2) {
      // 불일치 감지는 Claude Sonnet 사용 (사용 가능하면)
      const disagreementProvider = available.includes("claude")
        ? getProvider("claude")
        : getProvider(available[0]);

      try {
        const disagreementResult = await disagreementProvider.chat({
          system: "너는 분석 비교 전문가다. 여러 관점의 분석을 비교하여 불일치를 찾는다. JSON으로만 응답해라.",
          messages: [
            { role: "user", content: buildDisagreementPrompt(analyses) },
          ],
          maxTokens: 800,
          temperature: 0.3,
        });

        const parsed = parseJSON<Disagreement[]>(disagreementResult.text, []);
        if (Array.isArray(parsed)) {
          disagreements = parsed;
        }
      } catch {
        // 불일치 감지 실패해도 진행
      }
    }

    const response: AnalyzeResponse = {
      analyses,
      disagreements,
      crystalModelMap,
      safetyLevel,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ultimate analyze error:", error);
    return NextResponse.json(
      { error: "구슬 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
