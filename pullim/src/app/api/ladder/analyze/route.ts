import { NextRequest, NextResponse } from "next/server";
import { detectCrisis } from "@/lib/safety/crisis-detector";
import { CrisisLevel } from "@/lib/types-ultimate";
import { getAvailableProviders, parallelChat } from "@/lib/providers";
import { isDemoMode } from "@/lib/demo";

export interface LadderPerspective {
  name: string;
  model: string;
  observation: string;
  question: string;
}

interface LadderAnalyzeRequest {
  topicSummary: string;
  messages: { role: string; content: string }[];
  theme: string;
}

interface LadderAnalyzeResponse {
  perspectives: LadderPerspective[];
  disagreement: string | null;
  demoMode: boolean;
}

const PERSPECTIVE_NAMES = ["공감형 시각", "분석형 시각", "도전형 시각"] as const;

const DEMO_PERSPECTIVES: LadderPerspective[] = [
  {
    name: "공감형 시각",
    model: "demo",
    observation: "지금 많이 지쳐 있는 것 같아요.",
    question: "지금 가장 쉬고 싶은 부분은 어디인가요?",
  },
  {
    name: "분석형 시각",
    model: "demo",
    observation: "현재 상황을 정리하면 선택지가 보일 수 있어요.",
    question: "가장 먼저 해결하고 싶은 한 가지는?",
  },
  {
    name: "도전형 시각",
    model: "demo",
    observation: "지금이 변화할 타이밍일 수 있어요.",
    question: "만약 실패해도 괜찮다면 뭘 하고 싶으세요?",
  },
];

const DEMO_DISAGREEMENT =
  "공감형은 쉼을 권하고, 도전형은 행동을 권합니다. 어느 쪽이 끌리나요?";

function buildPerspectivePrompt(
  perspectiveName: string,
  topicSummary: string
): string {
  const perspectiveGuide: Record<string, string> = {
    "공감형 시각": "감정과 공감 중심으로 바라본다. 상대방의 감정 상태를 먼저 이해하고 안심시키는 관점.",
    "분석형 시각": "논리와 구조 중심으로 바라본다. 상황을 객관적으로 분석하고 선택지를 명확히 하는 관점.",
    "도전형 시각": "성장과 변화 중심으로 바라본다. 현재 상황을 돌파구로 보고 행동을 촉구하는 관점.",
  };

  return `사용자가 '${topicSummary}'에 대해 고민 중이다.
당신은 ${perspectiveName}(${perspectiveGuide[perspectiveName] || perspectiveName})에서 이 상황을 바라본다.

[규칙]
- 1~2문장으로 관찰(observation)을 작성해라.
- 사용자가 스스로 생각해볼 질문(question) 1개를 던져라. 30자 이내, 즉답 불가(Yes/No 아님).
- 한국어로 작성.
- 사용자의 자기가치감을 흔드는 표현 금지.

[출력 형식 — JSON만]
{
  "observation": "1~2문장 관찰",
  "question": "질문"
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

function detectDisagreement(perspectives: LadderPerspective[]): string | null {
  if (perspectives.length < 2) return null;
  const empathy = perspectives.find((p) => p.name === "공감형 시각");
  const challenge = perspectives.find((p) => p.name === "도전형 시각");
  if (empathy && challenge) {
    return `공감형은 현재 감정 상태에 집중하고, 도전형은 행동 변화를 권합니다. 어느 쪽이 더 끌리나요?`;
  }
  return null;
}

export async function POST(req: NextRequest) {
  console.log('[mode]', isDemoMode() ? 'demo' : 'glm');
  const body = (await req.json()) as LadderAnalyzeRequest;
  const { topicSummary } = body;

  if (!topicSummary) {
    return NextResponse.json({ error: "topicSummary 필수" }, { status: 400 });
  }

  // Demo mode
  if (isDemoMode()) {
    return NextResponse.json({
      perspectives: DEMO_PERSPECTIVES,
      disagreement: DEMO_DISAGREEMENT,
      demoMode: true,
    } satisfies LadderAnalyzeResponse);
  }

  // 위기 감지
  const crisisResult = detectCrisis(topicSummary);
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
    return NextResponse.json({
      perspectives: DEMO_PERSPECTIVES,
      disagreement: DEMO_DISAGREEMENT,
      demoMode: true,
    } satisfies LadderAnalyzeResponse);
  }

  try {
    // 3개 관점에 모델 할당 (라운드 로빈)
    const calls = PERSPECTIVE_NAMES.map((name, i) => ({
      provider: available[i % available.length],
      params: {
        system:
          "너는 의사결정 보조 에이전트다. 주어진 관점으로만 분석하고, JSON으로만 응답해라.",
        messages: [
          {
            role: "user" as const,
            content: buildPerspectivePrompt(name, topicSummary),
          },
        ],
        maxTokens: 400,
        temperature: 0.7,
      },
    }));

    const results = await parallelChat(calls);

    const perspectives: LadderPerspective[] = [];
    for (let i = 0; i < results.length; i++) {
      const { provider, result } = results[i];
      const name = PERSPECTIVE_NAMES[i];

      if (result instanceof Error) {
        // 실패한 관점은 데모 데이터로 대체
        perspectives.push({ ...DEMO_PERSPECTIVES[i] });
        continue;
      }

      const parsed = parseJSON<{ observation: string; question: string }>(
        result.text,
        { observation: DEMO_PERSPECTIVES[i].observation, question: DEMO_PERSPECTIVES[i].question }
      );

      perspectives.push({
        name,
        model: provider,
        observation: parsed.observation || DEMO_PERSPECTIVES[i].observation,
        question: parsed.question || DEMO_PERSPECTIVES[i].question,
      });
    }

    const disagreement = detectDisagreement(perspectives);

    return NextResponse.json({
      perspectives,
      disagreement,
      demoMode: false,
    } satisfies LadderAnalyzeResponse);
  } catch (error) {
    console.error("Ladder analyze error:", error);
    return NextResponse.json({
      perspectives: DEMO_PERSPECTIVES,
      disagreement: DEMO_DISAGREEMENT,
      demoMode: true,
    } satisfies LadderAnalyzeResponse);
  }
}
