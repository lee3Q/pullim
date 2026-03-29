// 이면 사고 엔진: 수집 → 추론 → 조정
// 사용자에게 보이지 않는 레이어

import type { BehaviorSignals } from "../personalization/behavior-reader";
import type { LadderLevel, BehindEvent, LadderMessage, ThemeSuggestion } from "./ladder-types";

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

  // 톤 조정 — 12종 (복합 조건 우선, 레벨별 특화, 단일 신호 순)
  let toneAdjustment: string | null = null;

  // ── 첫 턴 ──
  if (signals.turnCount === 0) {
    toneAdjustment = "아직 모르는 상태. 가볍게 시작하라. 판단하지 마라.";

  // ── 복합 조건 (3개) ──
  } else if (fatigue && opening) {
    toneAdjustment = "쉬고 싶지만 말하고 싶어하는 상태. 부담 없이 따라가라. 끝내지 마라.";
  } else if (confident && dissatisfied) {
    toneAdjustment = "방향은 알지만 제시된 것이 맞지 않는다. 다른 각도를.";
  } else if (fatigue && struggling) {
    toneAdjustment = "완전히 지쳐있다. 한 가지만. 오늘은 여기까지 제안해도 된다.";

  // ── 복합 조건 추가 ──
  } else if (confident && opening) {
    toneAdjustment = "확신과 개방이 동시에 나타난다. 더 깊은 질문으로 자연스럽게 이끌어라.";

  // ── 레벨별 특화 (3개) ──
  } else if ((currentLevel === 1 || currentLevel === 2) && struggling) {
    toneAdjustment = "감각 단계에서 막히고 있다. 선택지를 두 개로 줄여라. 단순하게.";
  } else if (currentLevel === 3 && dissatisfied) {
    toneAdjustment = "분석 단계에서 맞지 않다. 분석 각도를 완전히 바꿔라. 다른 프레임.";
  } else if (currentLevel === 5 && fatigue) {
    toneAdjustment = "직접 말하는 단계에서 지쳐있다. 질문 줄이고 공감으로.";

  // ── 단일 신호 (5개) ──
  } else if (fatigue) {
    toneAdjustment = "피로 감지. 가볍게 전환하거나 마무리 제안. 길게 말하지 마라.";
  } else if (struggling) {
    toneAdjustment = "결정이 어렵다. 선택지를 줄이고 더 쉽게. 부담 주지 마라.";
  } else if (opening) {
    toneAdjustment = "마음이 열리는 중. 끊지 말고 따라가라. 질문을 너무 많이 하지 마라.";
  } else if (dissatisfied && recentRejects >= 2) {
    toneAdjustment = "접근 방식이 맞지 않다. 완전히 다른 각도로 시도하라.";
  } else if (dissatisfied) {
    toneAdjustment = "한 번 불만족. 같은 방식 반복하지 말고 조금 다른 방향으로.";
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

/**
 * 추론 결과 → 짧은 표시 텍스트 (이면사고 토글 UI용)
 * 데모에서 "이 AI가 나를 어떻게 파악하는지" 시각화
 */
export function describeBehindInference(inference: BehindInference): string | null {
  if (inference.topicExhausted) return "💭 [주제 소진] 전환 고려 중...";
  if (inference.fatigue && inference.opening) return "💭 [피로+열림] 가볍게 따라가는 중...";
  if (inference.fatigue && inference.struggling) return "💭 [피로+어려움] 최소화 중...";
  if (inference.confident && inference.dissatisfied) return "💭 [확신+불만] 각도 전환 중...";
  if (inference.confident && inference.opening) return "💭 [확신+열림] 깊이 들어가는 중...";
  if (inference.fatigue) return "💭 [피로 감지] 가볍게 전환 중...";
  if (inference.struggling) return "💭 [결정 어려움] 쉽게 조정 중...";
  if (inference.opening) return "💭 [마음 열림] 따라가는 중...";
  if (inference.dissatisfied) return "💭 [불만족] 각도 바꾸는 중...";
  if (inference.confident) return "💭 [확신] 깊이 들어가는 중...";
  return null;
}

/**
 * 치트 후 분기 판단: "답만 별로" vs "테마가 안 맞는 듯" vs "누적 3회"
 *
 * 테마 전환 판단 기준 (이면사고 레이어):
 * - 감각 선택 계속 거부 + 분석적 텍스트 입력 → 전략실 제안
 * - 분석 단계에서 감정적 반응 → 달빛정원 제안
 * - 모험가에서 반복 치트 + 짧은 응답 → 전략실/달빛정원 제안
 */
export function inferCheatAction(
  cheatCount: number,
  events: BehindEvent[],
  messages: LadderMessage[],
  currentLevel: LadderLevel,
  currentTheme: "모험가" | "전략실" | "달빛정원" | "천문대" | "종말"
): { action: "regenerate" | "theme_suggest" | "fold"; themeSuggestion?: ThemeSuggestion } {
  // c) 누적 3회 → 접어두기 제안
  if (cheatCount >= 3) {
    return { action: "fold" };
  }

  // b) 테마 불일치 패턴 감지
  const recentUserMessages = messages
    .filter((m) => m.role === "user")
    .slice(-5);

  const recentCheats = events.filter(
    (e) => e.type === "cheat" && Date.now() - e.timestamp < 300_000
  ).length;

  // 감각 레벨(1-2)에서 치트 반복 + 사용자가 긴 텍스트 입력 → 분석적 성향 → 전략실
  if (currentTheme !== "전략실") {
    const sensoryLevelCheats = events.filter(
      (e) => e.type === "cheat" && e.level <= 2 && Date.now() - e.timestamp < 300_000
    ).length;
    const hasAnalyticalInput = recentUserMessages.some(
      (m) => m.content.length > 30
    );
    if (sensoryLevelCheats >= 2 && hasAnalyticalInput) {
      return {
        action: "theme_suggest",
        themeSuggestion: {
          targetTheme: "전략실",
          reason: "분석적으로 생각하는 게 더 편할 수도 있어",
        },
      };
    }
  }

  // 분석 레벨(3+)에서 치트 + 짧은 감정적 응답 → 감성 성향 → 달빛정원
  if (currentTheme !== "달빛정원") {
    const analysisLevelCheats = events.filter(
      (e) => e.type === "cheat" && e.level >= 3 && Date.now() - e.timestamp < 300_000
    ).length;
    const hasEmotionalShortInput = recentUserMessages.some(
      (m) => m.content.length <= 10 && m.level >= 3
    );
    if (analysisLevelCheats >= 2 && hasEmotionalShortInput) {
      return {
        action: "theme_suggest",
        themeSuggestion: {
          targetTheme: "달빛정원",
          reason: "조금 더 편안한 분위기에서 이야기해볼까",
        },
      };
    }
  }

  // 같은 테마에서 치트 2회 연속 → 다른 테마 제안
  if (recentCheats >= 2 && cheatCount >= 2) {
    const alternativeTheme = currentTheme === "모험가"
      ? "달빛정원"
      : currentTheme === "전략실"
        ? "달빛정원"
        : "모험가";
    return {
      action: "theme_suggest",
      themeSuggestion: {
        targetTheme: alternativeTheme,
        reason: "분위기를 바꿔보면 다르게 느껴질 수도 있어",
      },
    };
  }

  // a) 기본: 답만 별로 → 같은 레벨 재생성
  return { action: "regenerate" };
}
