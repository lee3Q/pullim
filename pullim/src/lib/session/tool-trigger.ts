// 도구 트리거 감지 로직 — 리서치/분석 API 자동/수동 트리거 판단

import type { LadderMessage } from "./ladder-types";
import type { BehindInference } from "./behind-the-scenes";

export interface ToolTriggerState {
  researchTriggered: boolean;  // 세션 내 리서치 이미 실행했는지
  analysisTriggered: boolean;  // 세션 내 분석 이미 실행했는지
  turnCount: number;
  topicSummary: string;        // 현재까지 파악된 주제 요약
}

export interface ToolSuggestion {
  type: "research" | "analysis" | null;
  reason: string;              // 왜 이 도구를 제안하는지 (UI 표시용)
  autoTrigger: boolean;        // true면 자동 실행, false면 버튼 제안
}

const RESEARCH_KEYWORDS = ["찾아", "검색", "리서치", "조사", "데이터", "통계", "사례"];
const ANALYSIS_KEYWORDS = ["분석", "다른 시각", "다른 관점", "비교", "의견"];

/**
 * 마지막 사용자 메시지에서 키워드 매칭
 */
function detectKeyword(
  messages: LadderMessage[],
  keywords: string[]
): boolean {
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUserMsg) return false;
  return keywords.some((kw) => lastUserMsg.content.includes(kw));
}

/**
 * 도구 트리거 판단
 * - 둘 다 실행됐으면 null
 * - 명시적 키워드 요청 → autoTrigger: true
 * - 자동 조건(턴수 + inference) → autoTrigger: false (버튼 제안)
 */
export function checkToolTrigger(
  messages: LadderMessage[],
  state: ToolTriggerState,
  inference: BehindInference | null
): ToolSuggestion {
  const nullSuggestion: ToolSuggestion = { type: null, reason: "", autoTrigger: false };

  // 둘 다 실행됨
  if (state.researchTriggered && state.analysisTriggered) {
    return nullSuggestion;
  }

  // ── 명시적 키워드 요청 ──
  if (!state.researchTriggered && detectKeyword(messages, RESEARCH_KEYWORDS)) {
    return {
      type: "research",
      reason: "이 주제에 대해 데이터를 찾아볼 수 있어",
      autoTrigger: true,
    };
  }

  if (!state.analysisTriggered && detectKeyword(messages, ANALYSIS_KEYWORDS)) {
    return {
      type: "analysis",
      reason: "다른 AI들은 어떻게 볼지 확인해볼까?",
      autoTrigger: true,
    };
  }

  // ── 자동 트리거 (버튼 제안) ──
  // 리서치: 턴 4+ && 아직 안 함 && 마음 열림 상태
  if (
    !state.researchTriggered &&
    state.turnCount >= 4 &&
    inference?.opening === true
  ) {
    return {
      type: "research",
      reason: "이 주제에 대해 데이터를 찾아볼 수 있어",
      autoTrigger: false,
    };
  }

  // 분석: 턴 6+ && 아직 안 함 && 리서치 이미 실행됨
  if (
    !state.analysisTriggered &&
    state.turnCount >= 6 &&
    state.researchTriggered
  ) {
    return {
      type: "analysis",
      reason: "다른 AI들은 어떻게 볼지 확인해볼까?",
      autoTrigger: false,
    };
  }

  return nullSuggestion;
}

/**
 * 사용자 메시지에서 주제 요약 추출
 * - role=user 메시지만 필터, 최근 4개, 100자 제한
 */
export function extractTopicSummary(messages: LadderMessage[]): string {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .slice(-4)
    .map((m) => m.content.trim())
    .filter((c) => c.length > 0);

  if (userMessages.length === 0) {
    return "(아직 주제 파악 중)";
  }

  const combined = userMessages.join(" ");
  return combined.length <= 100 ? combined : combined.slice(0, 100);
}
