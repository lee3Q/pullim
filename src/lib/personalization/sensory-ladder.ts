// 양방향 감각화 사다리
// 막막한 사람 → 올라가기 (감각→분석→결정)
// 합리적 사람 → 내려가기 (분석→감각→발견)

import type { ProbabilityProfile } from "./probability-profile";

export type SensoryDirection = "up" | "down" | "neutral";

/**
 * 프로필 기반 감각화 방향 결정
 */
export function getSensoryDirection(profile: ProbabilityProfile): SensoryDirection {
  const sa = profile.selfAwareness.value;
  const approach = profile.approachStyle.value;

  // 자기이해 높고 분석적 → 내려가기 (감각으로)
  if (sa > 0.3 && approach < -0.3) return "down";

  // 자기이해 낮음 → 올라가기 (감각에서 시작)
  if (sa < -0.3) return "up";

  // 그 외 → 중립 (AI가 반응 보면서 판단)
  return "neutral";
}

/**
 * SENSORY_LADDER 컨텍스트 문자열 생성
 * listen/route.ts에서 시스템 프롬프트에 주입
 */
export function buildSensoryLadderContext(profile: ProbabilityProfile): string {
  const direction = getSensoryDirection(profile);

  const lines = [
    "[SENSORY_LADDER]",
    `현재 감각화 방향: ${direction === "up" ? "올라가기" : direction === "down" ? "내려가기" : "중립"}`,
    "",
  ];

  if (direction === "up") {
    lines.push(
      "이 사용자는 자기이해가 낮다. 감각에서 시작해서 올라가라:",
      "- 먼저 이모지 선택지로 느낌을 물어라 (\"이거 좋아? 싫어?\" 수준)",
      "- 사용자가 반응하면 조금 더 구체적으로 (\"이렇게 보이는데 맞아?\")",
      "- 충분히 파악되면 결정으로 (\"이걸로 갈까?\")",
      "- 급하게 올라가지 마라. 사용자 반응을 보면서 천천히.",
    );
  } else if (direction === "down") {
    lines.push(
      "이 사용자는 분석적이고 자기이해가 높다. 분석에서 시작해서 내려가라:",
      "- 사용자가 이미 정리한 내용을 먼저 확인하라",
      "- 분석이 끝났으면 \"구조는 알겠어. 그럼 느낌은?\" 처럼 감각으로 내려가라",
      "- \"혹시 이건 아닐까 —\" 새로운 프레임을 제시하라",
      "- 사용자가 이미 아는 것을 반복하지 마라.",
    );
  } else {
    lines.push(
      "이 사용자는 중간 지점이다. 반응을 보면서 방향을 정하라:",
      "- 첫 응답의 길이와 구체성으로 판단",
      "- 장문+분석적이면 내려가기, 단답+불확실하면 올라가기",
    );
  }

  lines.push(
    "",
    "선택지 생성 규칙:",
    "1. 항상 3~4개 + [직접 쓰기] 옵션",
    "2. 하나에 [추천] 표시 (프로필 기반 가장 가능성 높은 것)",
    "3. 사용자가 추천과 다른 걸 고르면 → 그 방향으로 자연스럽게 전환",
    "4. \"모르겠어\" 류의 선택지 항상 포함 (폴백)",
    "5. 선택지는 이모지 + 짧은 텍스트. 텍스트 게임처럼 가볍게.",
    "",
    `사용자 프로필 요약:`,
    `- selfAwareness: ${profile.selfAwareness.value.toFixed(2)} (${profile.selfAwareness.observations}회 관찰)`,
    `- approachStyle: ${profile.approachStyle.value.toFixed(2)}`,
    `- riskTolerance: ${profile.riskTolerance.value.toFixed(2)}`,
    `- copingStyle: ${profile.copingStyle.value.toFixed(2)}`,
    `- decisionSpeed: ${profile.decisionSpeed.value.toFixed(2)}`,
    `- 추천 수락률: ${(profile.recommendationAcceptRate * 100).toFixed(0)}%`,
    "[/SENSORY_LADDER]",
  );

  return lines.join("\n");
}
