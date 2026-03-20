import { NextRequest, NextResponse } from "next/server";
import { getClient, ROUTING_MODEL } from "@/lib/llm/claude";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { DataCard, CrystalAnalysis, Disagreement, DebateRound } from "@/lib/types-ultimate";
import { isDemoMode, DEMO_JUDGE_RESPONSE } from "@/lib/demo";

type JudgeMode = "factcheck" | "logic";

interface JudgeFactcheckRequest {
  mode: "factcheck";
  cards: DataCard[];
  concern: string;
}

interface JudgeLogicRequest {
  mode: "logic";
  concern: string;
  listenSummary: string;
  analyses: CrystalAnalysis[];
  disagreements: Disagreement[];
  debateRounds: DebateRound[];
  debateSynthesis: string;
}

type JudgeRequest = JudgeFactcheckRequest | JudgeLogicRequest;

interface JudgeResponse {
  confidence: "high" | "medium" | "low";
  issues: string[];
  passed: boolean;
}

function buildFactcheckPrompt(cards: DataCard[], concern: string): string {
  const cardTexts = cards
    .map((c, i) => `${i + 1}. [${c.title}] ${c.fact} (출처: ${c.source.name})`)
    .join("\n");

  return `너는 팩트체크 심판이다. 아래 리서치 결과에서 의심스러운 주장을 찾아라.

[사용자 고민]
${concern}

[리서치 결과]
${cardTexts}

[검증 규칙]
- 각 팩트가 논리적으로 타당한지 확인
- 수치가 있다면 상식 범위인지 확인
- 출처가 신뢰할 수 있는지 평가
- 고민과 관련성이 있는지 확인

[출력 — JSON만]
{
  "confidence": "high 또는 medium 또는 low",
  "issues": ["의심스러운 점 1", "의심스러운 점 2"],
  "passed": true 또는 false
}

문제 없으면 issues는 빈 배열, passed는 true.`;
}

function buildLogicPrompt(data: JudgeLogicRequest): string {
  const analysisText = data.analyses
    .map((a) => `[${a.crystal}] ${a.observation} / ${a.insight}`)
    .join("\n");

  const debateText = data.debateRounds
    .map((r) => `[R${r.round} ${r.crystal}] ${r.content}`)
    .join("\n");

  return `너는 논리 검증 심판이다. 아래 세션의 전체 흐름에서 논리적 모순, 누락, 비약을 찾아라.

[고민]
${data.concern}

[경청 요약]
${data.listenSummary}

[구슬 분석]
${analysisText}

[불일치]
${data.disagreements.map((d) => `- ${d.topic}: ${d.userImplication}`).join("\n") || "없음"}

[토론]
${debateText}

[토론 합성]
${data.debateSynthesis}

[검증 규칙]
- 분석 → 토론 → 합성 사이에 논리적 비약이 없는지
- 중요한 관점이 누락되지 않았는지
- 결론이 분석 결과와 일관되는지
- 사용자 고민에 실질적으로 도움이 되는지

[출력 — JSON만]
{
  "confidence": "high 또는 medium 또는 low",
  "issues": ["문제점 1", "문제점 2"],
  "passed": true 또는 false
}

문제 없으면 issues는 빈 배열, passed는 true.`;
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
  const body = (await req.json()) as JudgeRequest;

  if (!body.mode) {
    return NextResponse.json(
      { error: "mode 필수 (factcheck | logic)" },
      { status: 400 }
    );
  }

  // Demo mode
  if (isDemoMode()) {
    return NextResponse.json(DEMO_JUDGE_RESPONSE);
  }

  // 위기 감지 (설계 원칙: 모든 사용자 입력에 적용)
  const inputText = body.mode === "factcheck" ? body.concern : body.concern;
  if (inputText) {
    const crisisResult = detectCrisis(inputText);
    if (crisisResult.tier === "A") {
      return NextResponse.json({
        confidence: "low" as const,
        issues: ["위기 감지됨"],
        passed: false,
      } satisfies JudgeResponse);
    }
  }

  let client;
  try {
    client = getClient();
  } catch {
    // Judge 실패해도 세션 중단하지 않음 — 검증 스킵
    return NextResponse.json({
      confidence: "low" as const,
      issues: ["검증 서비스 일시 장애"],
      passed: true, // 실패 시에도 통과시켜서 세션 중단 방지
    } satisfies JudgeResponse);
  }

  try {
    let prompt: string;

    if (body.mode === "factcheck") {
      if (!body.cards || body.cards.length === 0) {
        return NextResponse.json({
          confidence: "high" as const,
          issues: [],
          passed: true,
        } satisfies JudgeResponse);
      }
      prompt = buildFactcheckPrompt(body.cards, body.concern);
    } else {
      if (!body.analyses || body.analyses.length === 0) {
        return NextResponse.json({
          confidence: "high" as const,
          issues: [],
          passed: true,
        } satisfies JudgeResponse);
      }
      prompt = buildLogicPrompt(body);
    }

    const response = await client.messages.create({
      model: ROUTING_MODEL, // Haiku — 가벼움, 비용 낮음
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    const result = parseJSON<JudgeResponse>(rawText, {
      confidence: "medium",
      issues: [],
      passed: true,
    });

    // 유효성 보정
    const confidence = ["high", "medium", "low"].includes(result.confidence)
      ? result.confidence
      : "medium";

    return NextResponse.json({
      confidence: confidence as "high" | "medium" | "low",
      issues: Array.isArray(result.issues) ? result.issues : [],
      passed: typeof result.passed === "boolean" ? result.passed : true,
    } satisfies JudgeResponse);
  } catch (error) {
    console.error("Judge error:", error);
    // 검증 실패해도 세션 중단 방지
    return NextResponse.json({
      confidence: "low" as const,
      issues: ["검증 중 오류 발생"],
      passed: true,
    } satisfies JudgeResponse);
  }
}
