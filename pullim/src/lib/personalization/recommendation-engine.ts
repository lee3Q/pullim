// 추천 선택지 결정 엔진
// 추천은 관찰 도구: 맞추려는 게 아니라, 틀림이 데이터.

import type { ProbabilityProfile } from "./probability-profile";

export interface ChoiceRecord {
  turnNumber: number;
  options: string[];
  recommendedIndex: number;
  chosenIndex: number;      // -1 = 직접 입력
  responseTimeMs: number;
  isMatch: boolean;
  timestamp: string;
}

/**
 * 세션 내 추천 불일치 기록을 프로필에 반영
 * 불일치 = weight 1.5, 일치 = weight 1.0
 */
export function computeSessionAcceptRate(records: ChoiceRecord[]): number {
  if (records.length === 0) return 0.5;
  const matches = records.filter((r) => r.isMatch).length;
  return matches / records.length;
}

// 프로필 axis 기반 키워드 매핑
const EMPATHY_KEYWORDS = ["마음", "감정", "느낌", "위로", "편안", "기다", "들어"];
const ANALYTICAL_KEYWORDS = ["분석", "논리", "비교", "정리", "데이터", "이유", "근거"];
const ADVENTUROUS_KEYWORDS = ["도전", "모험", "새로", "시도", "과감", "직감"];
const CAUTIOUS_KEYWORDS = ["신중", "안전", "천천", "조심", "확인", "생각"];

function scoreOption(text: string, profile: ProbabilityProfile): number {
  let score = 0;

  // 감성/공감 키워드 → copingStyle.value > 0 일수록 높은 점수
  if (EMPATHY_KEYWORDS.some((kw) => text.includes(kw)) && profile.copingStyle.value > 0) {
    score += profile.copingStyle.value;
  }

  // 논리/분석 키워드 → approachStyle.value < 0 일수록 높은 점수
  if (ANALYTICAL_KEYWORDS.some((kw) => text.includes(kw)) && profile.approachStyle.value < 0) {
    score += -profile.approachStyle.value;
  }

  // 도전/모험 키워드 → riskTolerance.value > 0 일수록 높은 점수
  if (ADVENTUROUS_KEYWORDS.some((kw) => text.includes(kw)) && profile.riskTolerance.value > 0) {
    score += profile.riskTolerance.value;
  }

  // 신중/안전 키워드 → riskTolerance.value < 0 일수록 높은 점수
  if (CAUTIOUS_KEYWORDS.some((kw) => text.includes(kw)) && profile.riskTolerance.value < 0) {
    score += -profile.riskTolerance.value;
  }

  return score;
}

/**
 * 추천 인덱스 결정
 * 프로필 axis 기반 키워드 매칭으로 가장 적합한 선택지를 추천
 */
export function getRecommendedIndex(
  options: string[],
  profile: ProbabilityProfile | null
): number {
  if (options.length === 0) return 0;
  if (!profile) return 0;

  const scores = options.map((opt) => scoreOption(opt, profile));
  const maxScore = Math.max(...scores);

  // 모든 점수가 0이면 (매칭 없음) 첫 번째 반환
  if (maxScore === 0) return 0;

  return scores.indexOf(maxScore);
}
