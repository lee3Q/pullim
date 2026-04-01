// 추천 선택지 결정 엔진
// 추천은 관찰 도구: 맞추려는 게 아니라, 틀림이 데이터.

import type { ProbabilityProfile } from "./probability-profile";
import type { ThemeType } from "./story-scenes";

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
 * 테마 자동 추천
 * 프로필 axis 기반으로 가장 적합한 테마를 점수화하여 반환
 * totalObservations < 3 이면 "adventure" 기본값
 */
export function getRecommendedTheme(profile: ProbabilityProfile): ThemeType {
  if (profile.totalObservations < 3) return "adventure";

  const { approachStyle, riskTolerance, copingStyle, decisionSpeed } = profile;

  const scores: Record<ThemeType, number> = {
    // 달빛정원: 공감형(copingStyle > 0) + 신중(riskTolerance < 0)
    garden:
      Math.max(0, copingStyle.value) + Math.max(0, -riskTolerance.value),

    // 모험가: 모험적(riskTolerance > 0) + 직관(approachStyle > 0)
    adventure:
      Math.max(0, riskTolerance.value) + Math.max(0, approachStyle.value),

    // 전략실: 분석적(approachStyle < 0) + 숙고(decisionSpeed < 0)
    strategy:
      Math.max(0, -approachStyle.value) + Math.max(0, -decisionSpeed.value),

    // 천문대: 모험적(riskTolerance > 0) + copingStyle 중립(0 근처)
    stargazer:
      Math.max(0, riskTolerance.value) * (1 - Math.abs(copingStyle.value)),

    // 종말: riskTolerance > 0.3 + 즉흥적(decisionSpeed > 0)
    apocalypse:
      Math.max(0, riskTolerance.value - 0.3) + Math.max(0, decisionSpeed.value),
  };

  let bestTheme: ThemeType = "adventure";
  let bestScore = -Infinity;
  for (const [theme, score] of Object.entries(scores) as [ThemeType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return bestTheme;
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
