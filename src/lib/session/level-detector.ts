// 올라가기 감지: 사용자의 확신도를 기반으로 다음 레벨 자연 전환 판단
// AI가 유도하지 않음 — 사용자 행동에서 자동 감지

import type { LadderLevel, LadderMessage, BehindEvent } from "./ladder-types";
import type { BehindInference } from "./behind-the-scenes";

/**
 * 현재 레벨에서 올라갈 준비가 됐는지 판단
 * 조건: 이면 사고의 confident + 최근 2턴 연속 빠른 선택 + 치트 없음
 */
export function shouldLevelUp(
  currentLevel: LadderLevel,
  inference: BehindInference,
  recentMessages: LadderMessage[],
  events: BehindEvent[]
): boolean {
  if (currentLevel >= 5) return false;
  if (!inference.confident) return false;
  if (inference.fatigue || inference.struggling) return false;

  // 최근 2턴 연속 빠른 응답인지
  const lastTwo = recentMessages
    .filter((m) => m.role === "user")
    .slice(-2);
  if (lastTwo.length < 2) return false;

  // 최근 30초 이내 치트 이벤트 없음
  const recentCheats = events.filter(
    (e) => e.type === "cheat" && Date.now() - e.timestamp < 30_000
  );
  if (recentCheats.length > 0) return false;

  return true;
}

/**
 * 내려가기: "모르겠어" 선택 또는 이면 사고가 struggling 감지
 */
export function shouldLevelDown(
  currentLevel: LadderLevel,
  inference: BehindInference,
  userChoseUnknown: boolean
): boolean {
  if (currentLevel <= 1) return false;
  return userChoseUnknown || inference.suggestLevelDown;
}

/**
 * Level 5에서 "직접 쓰기"를 감지 (Level 4 → 5 전환)
 */
export function detectFreeTextIntent(userMessage: string): boolean {
  // 사용자가 선택지 대신 직접 긴 텍스트를 입력한 경우
  return userMessage.length >= 20;
}

/**
 * 세션 종료 가능 여부 감지
 * AI가 정리 유도할 수 있는 상태인지
 */
export function detectActionIntent(userMessage: string): boolean {
  const actionPatterns = [
    /해야겠/,
    /할래/,
    /하기로/,
    /결정했/,
    /이걸로/,
    /가보자/,
    /해볼게/,
    /시작하/,
    /그러자/,
    /알겠어/,
  ];
  return actionPatterns.some((p) => p.test(userMessage));
}
