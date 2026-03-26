// 이면 사고 엔진: 수집 → 추론 → 조정
// 사용자에게 보이지 않는 레이어

import type { BehaviorSignals } from "../personalization/behavior-reader";
import type { LadderLevel, BehindEvent, LadderMessage } from "./ladder-types";

export interface BehindInference {
  // 추론 결과
  fatigue: boolean;        // 피로/이탈 위험
  struggling: boolean;     // 결정 어려움
  opening: boolean;        // 마음 열림
  confident: boolean;      // 확신 증가
  dissatisfied: boolean;   // 불만족 (치트 피드백)
  topicExhausted: boolean; // 치트 3회 연속 → 주제 전환 제안
  // 조정 지시
  suggestLevelDown: boolean;
  suggestLevelUp: boolean;
  toneAdjustment: string | null;
}

/**
 * 규칙 기반 추론 (폴백용)
 */
export function inferStateSync(
  signals: BehaviorSignals,
  events: BehindEvent[],
  currentLevel: LadderLevel
): BehindInference {
  const recentCheats = events.filter(
    (e) => e.type === "cheat" && Date.now() - e.timestamp < 120_000
  ).length;

  const recentRejects = events.filter(
    (e) => e.type === "recommendation_reject" && Date.now() - e.timestamp < 180_000
  ).length;

  const fatigue =
    (signals.turnCount >= 3 && signals.lengthTrend === "shorter") ||
    (signals.turnCount >= 5 && signals.timeTrend === "faster" && signals.messageLength <= 5);

  const struggling =
    signals.choiceHesitationMs >= 30_000 ||
    signals.choiceChanges >= 2 ||
    recentCheats >= 2;

  const opening =
    signals.turnCount >= 3 && signals.lengthTrend === "longer";

  const confident =
    signals.responseTimeMs > 0 &&
    signals.responseTimeMs <= 5000 &&
    signals.choiceChanges === 0 &&
    !struggling;

  const dissatisfied = recentCheats >= 1;

  // 치트 3회 연속 → 주제 전환 제안
  const consecutiveCheats = events
    .filter((e) => e.type === "cheat")
    .slice(-3);
  const topicExhausted =
    consecutiveCheats.length >= 3 &&
    consecutiveCheats.every((e) => Date.now() - e.timestamp < 300_000);

  // 레벨 이동 추론
  const suggestLevelDown =
    (struggling && currentLevel > 1) ||
    (dissatisfied && currentLevel > 1);

  const suggestLevelUp =
    confident &&
    !fatigue &&
    currentLevel < 5 &&
    signals.turnCount >= 2;

  // 톤 조정
  let toneAdjustment: string | null = null;
  if (fatigue) {
    toneAdjustment = "피로 감지. 가볍게 전환하거나 마무리 제안. 길게 말하지 마라.";
  } else if (struggling) {
    toneAdjustment = "결정이 어렵다. 선택지를 줄이고 더 쉽게. 부담 주지 마라.";
  } else if (opening) {
    toneAdjustment = "마음이 열리는 중. 끊지 말고 따라가라. 질문을 너무 많이 하지 마라.";
  } else if (dissatisfied && recentRejects >= 2) {
    toneAdjustment = "접근 방식이 맞지 않다. 완전히 다른 각도로 시도하라.";
  }

  return {
    fatigue,
    struggling,
    opening,
    confident,
    dissatisfied,
    topicExhausted,
    suggestLevelDown,
    suggestLevelUp,
    toneAdjustment,
  };
}

/**
 * LLM 기반 추론 (async) — 실패 시 규칙 기반으로 폴백
 */
export async function inferState(
  signals: BehaviorSignals,
  events: BehindEvent[],
  currentLevel: LadderLevel,
  recentMessages?: LadderMessage[]
): Promise<BehindInference> {
  try {
    const res = await fetch("/api/behind-thought", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signals, events, currentLevel, recentMessages: (recentMessages ?? []).slice(-6) }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error("behind-thought API error");
    return (await res.json()) as BehindInference;
  } catch {
    return inferStateSync(signals, events, currentLevel);
  }
}

/**
 * 추론 결과 → 시스템 프롬프트 블록
 */
export function buildBehindContext(inference: BehindInference): string {
  const lines: string[] = ["[BEHIND_THE_SCENES]"];

  if (inference.toneAdjustment) {
    lines.push(`- ${inference.toneAdjustment}`);
  }

  if (inference.suggestLevelDown) {
    lines.push("- 사용자가 어려워하고 있다. 더 쉬운 형태(감각적/선택지)로 자연스럽게 전환하라.");
  }

  if (inference.suggestLevelUp) {
    lines.push("- 사용자가 확신을 보이고 있다. 다음 단계 요소를 자연스럽게 섞어라.");
  }

  if (inference.topicExhausted) {
    lines.push("- 사용자가 연속으로 불만족을 표현했다. '오늘은 이 주제 접어둘까?' 라고 제안하라. 다른 주제로 전환하거나 세션을 가볍게 마무리할 수 있게 하라.");
  } else if (inference.dissatisfied) {
    lines.push("- 사용자가 불만족을 표현했다. 같은 방식을 반복하지 말고 다른 접근을 시도하라.");
  }

  lines.push("위 내용을 사용자에게 직접 언급하지 마라. 행동으로만 반영.");
  lines.push("[/BEHIND_THE_SCENES]");

  return lines.length > 3 ? lines.join("\n") : "";
}
