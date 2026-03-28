// 확률 분포 기반 사용자 프로필
// 고정 라벨(analytical/intuitive)이 아닌, 차원별 연속값(-1~1)으로 저장.
// 세션마다 관찰이 누적되며, 빈도가 성격이 된다.

export interface UserDimension {
  value: number;        // -1.0 ~ 1.0
  observations: number; // 이 축에서 관찰된 횟수
  lastUpdated: string;  // ISO date
}

export interface ProbabilityProfile {
  // 차원별 연속값
  approachStyle: UserDimension;     // analytical(-1) ↔ intuitive(+1)
  riskTolerance: UserDimension;     // cautious(-1) ↔ adventurous(+1)
  copingStyle: UserDimension;       // problem_solving(-1) ↔ empathy(+1)
  decisionSpeed: UserDimension;     // deliberate(-1) ↔ spontaneous(+1)

  // 메타 지표
  selfAwareness: UserDimension;     // low(-1) ↔ high(+1)

  // 행동 기반 (세션 누적)
  avgResponseTimeMs: number;
  engagementTrend: number;          // -1(이탈 경향) ~ +1(몰입 경향)
  recommendationAcceptRate: number; // 추천 수락 비율 (0~1)

  // 세션 카운터
  totalSessions: number;
  totalObservations: number;

  // 온보딩 설정
  userName: string;
  speechStyle: "casual" | "formal";
  selectedTheme: "adventure" | "garden" | "strategy" | "stargazer";

  // [확장 포인트] 다음 Seed에서 추가될 필드
  // philosophyReactions?: Record<string, UserDimension>;
  // valueFramework?: Record<string, UserDimension>;
}

export function createEmptyDimension(): UserDimension {
  return { value: 0, observations: 0, lastUpdated: new Date().toISOString() };
}

export function createEmptyProfile(): ProbabilityProfile {
  return {
    approachStyle: createEmptyDimension(),
    riskTolerance: createEmptyDimension(),
    copingStyle: createEmptyDimension(),
    decisionSpeed: createEmptyDimension(),
    selfAwareness: createEmptyDimension(),
    avgResponseTimeMs: 0,
    engagementTrend: 0,
    recommendationAcceptRate: 0.5,
    totalSessions: 0,
    totalObservations: 0,
    userName: "",
    speechStyle: "casual",
    selectedTheme: "adventure",
  };
}

/**
 * 차원 업데이트: 가중 이동 평균.
 * 추천 불일치 시 weight=1.5 (새로운 면일 확률 높음)
 */
export function updateDimension(
  dim: UserDimension,
  newSignal: number,  // -1 or +1
  weight: number = 1
): UserDimension {
  const totalWeight = dim.observations + weight;
  const newValue = (dim.value * dim.observations + newSignal * weight) / totalWeight;
  return {
    value: Math.max(-1, Math.min(1, newValue)),
    observations: dim.observations + 1,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 선택 기록에서 차원별 신호를 추출해 프로필 업데이트
 */
export type DimensionKey = "approachStyle" | "riskTolerance" | "copingStyle" | "decisionSpeed";

export function updateProfileFromSelection(
  profile: ProbabilityProfile,
  dimensionKey: DimensionKey,
  signal: number,
  weight: number = 1
): ProbabilityProfile {
  return {
    ...profile,
    [dimensionKey]: updateDimension(profile[dimensionKey], signal, weight),
    totalObservations: profile.totalObservations + 1,
  };
}

/**
 * 추천 수락/거부 → recommendationAcceptRate 업데이트
 * 이동 평균 방식: rate = (기존 * N + 새 값) / (N + 1)
 */
export function updateRecommendationRate(
  profile: ProbabilityProfile,
  accepted: boolean
): ProbabilityProfile {
  const n = profile.totalObservations || 1;
  const signal = accepted ? 1 : 0;
  const newRate = (profile.recommendationAcceptRate * n + signal) / (n + 1);
  return {
    ...profile,
    recommendationAcceptRate: Math.max(0, Math.min(1, newRate)),
  };
}
