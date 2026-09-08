import "server-only";
// LLM 기반 이면 사고 추론 (Gemini Flash Lite)
// 행동 신호 + 이벤트 + 대화 컨텍스트 → BehindInference JSON

import { getGenAI } from "@/lib/llm/gemini";
import type { BehaviorSignals } from "@/lib/personalization/behavior-reader";
import type { BehindEvent, LadderMessage, LadderLevel } from "./ladder-types";
import type { BehindInference } from "./behind-the-scenes";

const BEHIND_LLM_MODEL = "gemini-2.0-flash-lite";
const TIMEOUT_MS = 3000;

function buildPrompt(
  signals: BehaviorSignals,
  events: BehindEvent[],
  currentLevel: LadderLevel,
  recentMessages: LadderMessage[]
): string {
  const recentTurns = recentMessages
    .filter((m) => m.role !== "system")
    .slice(-6)
    .map((m) => `[${m.role === "user" ? "사용자" : "AI"}] ${m.content.slice(0, 200)}`)
    .join("\n");

  const recentEvents = events
    .slice(-10)
    .map((e) => `${e.type} (레벨 ${e.level})`)
    .join(", ");

  return `당신은 심리 상태 분석 전문가입니다. 아래 데이터를 분석하여 사용자의 현재 심리 상태를 JSON으로 반환하세요.

## 행동 신호
- 응답시간(ms): ${signals.responseTimeMs}
- 메시지 길이: ${signals.messageLength}자
- 길이 트렌드: ${signals.lengthTrend}
- 시간 트렌드: ${signals.timeTrend}
- 선택 망설임(ms): ${signals.choiceHesitationMs}
- 선택 변경 횟수: ${signals.choiceChanges}
- 현재 턴 수: ${signals.turnCount}

## 현재 레벨
${currentLevel} (1=감각, 2=감각변형, 3=분석제안, 4=선택지, 5=직접말하기)

## 최근 이벤트
${recentEvents || "없음"}

## 최근 대화 (최대 6턴)
${recentTurns || "없음"}

## 반환 형식 (JSON만, 다른 텍스트 없이)
{
  "fatigue": true/false,       // 피로/이탈 위험
  "struggling": true/false,    // 결정이 어렵거나 힘들어함
  "opening": true/false,       // 마음이 열리는 중
  "confident": true/false,     // 확신이 증가하는 중
  "dissatisfied": true/false,  // 불만족 상태
  "topicExhausted": true/false,// 주제가 소진됨 (치트 반복 등)
  "suggestLevelDown": true/false, // 더 쉬운 레벨로 전환 필요
  "suggestLevelUp": true/false,   // 더 깊은 레벨로 전환 가능
  "toneAdjustment": "조정 지시문" | null  // null이면 조정 없음
}

toneAdjustment는 AI가 다음 응답에서 취해야 할 태도를 한 문장으로 작성하세요. 조정이 불필요하면 null.`;
}

export async function inferStateWithLLM(
  signals: BehaviorSignals,
  events: BehindEvent[],
  currentLevel: LadderLevel,
  recentMessages: LadderMessage[]
): Promise<BehindInference> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: BEHIND_LLM_MODEL });

  const prompt = buildPrompt(signals, events, currentLevel, recentMessages);

  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("behind-llm timeout")), TIMEOUT_MS)
  );

  const llmPromise = model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 256,
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const result = await Promise.race([llmPromise, timeoutPromise]);
  const text = result.response.text().trim();

  // JSON 파싱
  const parsed = JSON.parse(text) as BehindInference;

  // 필드 타입 보정 (LLM이 문자열로 줄 수 있음)
  return {
    fatigue: Boolean(parsed.fatigue),
    struggling: Boolean(parsed.struggling),
    opening: Boolean(parsed.opening),
    confident: Boolean(parsed.confident),
    dissatisfied: Boolean(parsed.dissatisfied),
    topicExhausted: Boolean(parsed.topicExhausted),
    suggestLevelDown: Boolean(parsed.suggestLevelDown),
    suggestLevelUp: Boolean(parsed.suggestLevelUp),
    toneAdjustment: parsed.toneAdjustment ?? null,
  };
}
