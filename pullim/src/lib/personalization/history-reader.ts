// 세션 간 프로필 기반 프롬프트 조정
// ProbabilityProfile 확률 분포 기반으로 톤 지시문 생성

import type { ProbabilityProfile } from "./probability-profile";

export interface SessionHistory {
  sessionCount: number;
  lastSatisfaction: number | null;
  completionRate: number;
}

export function buildHistoryContext(
  profile: ProbabilityProfile,
  history: SessionHistory
): string {
  const lines: string[] = ["[PERSONALIZATION_CONTEXT]"];

  // 말투 설정
  if (profile.speechStyle === "casual") {
    lines.push("이 사용자는 반말을 선호한다. 편하게 반말로 대화하라.");
  } else {
    lines.push("이 사용자는 존댓말을 선호한다. 정중하게 대화하라.");
  }

  // 이름
  if (profile.userName) {
    lines.push(`이 사용자의 이름은 "${profile.userName}"이다. 자연스럽게 이름을 불러라.`);
  }

  // 접근 스타일 + 리스크 허용도 (연속값 기반)
  const approach = profile.approachStyle.value;
  const risk = profile.riskTolerance.value;

  if (approach < -0.3 && risk < -0.3) {
    lines.push("이 사용자는 분석적이고 신중하다. 근거를 먼저 제시하고, 성급하게 결론짓지 마라.");
  } else if (approach > 0.3 && risk > 0.3) {
    lines.push("이 사용자는 직관적이고 도전적이다. 느낌을 먼저 물어보고, 데이터보다 감각으로 다가가라.");
  } else if (approach < -0.3) {
    lines.push("이 사용자는 분석적이다. 논리적 구조를 제시하되, 판단은 사용자에게 맡겨라.");
  } else if (approach > 0.3) {
    lines.push("이 사용자는 직관적이다. 질문을 단순하게, 느낌 위주로 접근하라.");
  }
  // 중간값(-0.3~0.3): 상황에 따라 다른 사람. 특별한 지시 없음.

  // 대처 스타일
  if (profile.copingStyle.value > 0.3) {
    lines.push("공감을 중시한다. 감정 반영 후 질문.");
  } else if (profile.copingStyle.value < -0.3) {
    lines.push("문제해결 지향이다. 감정보다 방법에 집중.");
  }

  // 결정 속도
  if (profile.decisionSpeed.value < -0.3) {
    lines.push("숙고형이다. 생각할 시간을 주고 재촉하지 마라.");
  } else if (profile.decisionSpeed.value > 0.3) {
    lines.push("즉흥형이다. 빠르게 진행하되 중요 지점에서 확인.");
  }

  // 자기이해도
  const sa = profile.selfAwareness.value;
  if (sa < -0.3) {
    lines.push("자기이해도가 낮다. 감각/직관 위주로 접근하라. 분석보다 느끼게 만들기.");
    if (profile.avgResponseTimeMs < 3000 && profile.totalObservations > 3) {
      lines.push("충동적 경향. 천천히 확인하며 진행.");
    } else {
      lines.push("진짜 모르는 상태. 최대한 부담 줄이고 쉬운 것부터.");
    }
  }

  // 세션 이력 기반
  if (history.lastSatisfaction !== null && history.lastSatisfaction <= 2) {
    lines.push("지난번에 만족하지 못했다. 다른 접근을 시도하라.");
  }

  if (history.sessionCount > 1 && history.completionRate < 0.5) {
    lines.push("이 사용자는 세션을 자주 중단한다. 핵심을 빨리.");
  }

  // 추천 수락률
  if (profile.totalObservations >= 10) {
    if (profile.recommendationAcceptRate < 0.3) {
      lines.push("이 사용자는 추천을 자주 거부한다. 다양한 선택지를 제시하라.");
    } else if (profile.recommendationAcceptRate > 0.7) {
      lines.push("이 사용자는 추천을 잘 따른다. 추천의 질을 높여라.");
    }
  }

  lines.push("위 내용을 사용자에게 직접 언급하지 마라. 행동으로만 반영.");
  lines.push("[/PERSONALIZATION_CONTEXT]");

  return lines.join("\n");
}
